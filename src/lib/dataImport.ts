import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  createTournament,
  updateTournament,
  deleteTournament,
  createTeam,
  updateTeam,
  getTeams,
  createMember,
  getMembers,
  createMatch,
  getMatches,
  createRegistration,
  logAudit,
} from './firestore';
import { saveCreatorConfig } from './creator';
import type { Tournament, Team, Member, Match, Registration, Payment } from '../types';
import type { TournamentExportPackage } from './dataExport';

export type ImportStrategy = 'create_new' | 'merge' | 'replace';

export interface ParsedData {
  isFullBackup?: boolean;
  formatVersion?: string;
  tournament?: Tournament;
  tournaments?: TournamentExportPackage[];
  teams?: Team[];
  members?: Record<string, Member[]>;
  matches?: Match[];
  registrations?: Registration[];
  payments?: Payment[];
  creatorConfig?: Record<string, unknown>;
  warnings?: string[];
}

export interface ImportResult {
  success: boolean;
  tournamentId?: string;
  importedTeamsCount: number;
  importedMembersCount: number;
  importedMatchesCount: number;
  importedRegistrationsCount: number;
  importedPaymentsCount: number;
  message: string;
  errors?: string[];
}

/**
 * Parses a standard .json file
 */
export async function parseJSONFile(file: File): Promise<ParsedData> {
  const text = await file.text();
  try {
    const json = JSON.parse(text);

    // Full Backup check
    if (json.backupType === 'full' || Array.isArray(json.tournaments)) {
      return {
        isFullBackup: true,
        formatVersion: json.formatVersion || '1.0',
        tournaments: json.tournaments || [],
        registrations: json.registrations || [],
        payments: json.payments || [],
        creatorConfig: json.creatorConfig || undefined,
      };
    }

    // Single Tournament check
    return {
      isFullBackup: false,
      formatVersion: json.formatVersion || '1.0',
      tournament: json.tournament || undefined,
      teams: Array.isArray(json.teams) ? json.teams : [],
      members: json.members && typeof json.members === 'object' ? json.members : {},
      matches: Array.isArray(json.matches) ? json.matches : [],
      registrations: Array.isArray(json.registrations) ? json.registrations : [],
      payments: Array.isArray(json.payments) ? json.payments : [],
    };
  } catch (err: unknown) {
    throw new Error('Invalid JSON format. Please upload a valid JSON file.');
  }
}

/**
 * Parses an Excel (.xlsx) file
 */
export async function parseExcelFile(file: File): Promise<ParsedData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  // 1. Tournament Sheet
  let tournament: Tournament | undefined;
  const tourneySheet = workbook.Sheets['Tournament'] || workbook.Sheets[workbook.SheetNames[0]];
  if (tourneySheet) {
    const rawTourneyRows: any[] = XLSX.utils.sheet_to_json(tourneySheet);
    if (rawTourneyRows.length > 0) {
      const row = rawTourneyRows[0];
      tournament = {
        id: String(row['Tournament ID'] || row.id || `TRN-${Date.now().toString(36)}`),
        name: String(row['Tournament Name'] || row.name || 'Imported Tournament'),
        game: row.Game === 'Free Fire' ? 'Free Fire' : 'BGMI',
        mode: row.Mode === 'CS' ? 'CS' : 'BR',
        status: row.Status || 'In Progress',
        startDate: row['Start Date'] || '',
        endDate: row['End Date'] || '',
        numMatches: Number(row['Total Matches'] || row.numMatches || 0),
        createdAt: row['Created At'] || new Date().toISOString(),
      };
    }
  }

  // 2. Teams Sheet
  const teams: Team[] = [];
  const teamsSheet = workbook.Sheets['Teams'];
  if (teamsSheet) {
    const rawTeams: any[] = XLSX.utils.sheet_to_json(teamsSheet);
    rawTeams.forEach((r, idx) => {
      teams.push({
        id: String(r['Team ID'] || r.id || `team-imp-${idx + 1}`),
        teamName: String(r['Team Name'] || r.teamName || `Team ${idx + 1}`),
        teamTag: r['Team Tag'] || r.teamTag || undefined,
        captainName: r['Captain Name'] || r.captainName || '',
        captainPhone: r['Captain Phone'] || r.captainPhone || '',
        captainEmail: r['Captain Email'] || r.captainEmail || '',
        mode: r.Mode || tournament?.mode || 'BR',
        registeredAt: r['Registered At'] || new Date().toISOString(),
      });
    });
  }

  // 3. Members Sheet
  const members: Record<string, Member[]> = {};
  const membersSheet = workbook.Sheets['Members'];
  if (membersSheet) {
    const rawMembers: any[] = XLSX.utils.sheet_to_json(membersSheet);
    rawMembers.forEach((r, idx) => {
      const teamId = String(r['Team ID'] || r.teamId || '');
      if (!teamId) return;
      if (!members[teamId]) members[teamId] = [];

      members[teamId].push({
        id: String(r['Member ID'] || r.id || `m-imp-${idx + 1}`),
        gameUid: String(r['Game UID'] || r.gameUid || `UID-${idx + 1}`),
        displayName: r['Display Name'] || r.displayName || '',
        ign: r.IGN || r.ign || r['Display Name'] || '',
        email: r.Email || r.email || undefined,
        isCaptain: String(r.Captain).toUpperCase() === 'YES' || r.isCaptain === true,
        isSubstitute: String(r.Substitute).toUpperCase() === 'YES' || r.isSubstitute === true,
        joinedAt: r['Joined At'] || new Date().toISOString(),
      });
    });
  }

  // 4. Matches Sheet
  const matches: Match[] = [];
  const matchesSheet = workbook.Sheets['Matches'];
  if (matchesSheet) {
    const rawMatches: any[] = XLSX.utils.sheet_to_json(matchesSheet);
    rawMatches.forEach((r, idx) => {
      matches.push({
        id: String(r['Match ID'] || r.id || `match-imp-${idx + 1}`),
        roundNumber: Number(r.Round || r.roundNumber || 1),
        teamAId: String(r['Team A ID'] || r.teamAId || ''),
        teamBId: String(r['Team B ID'] || r.teamBId || ''),
        mapName: r.Map || r.mapName || 'Erangel',
        status: (r.Status as any) || 'scheduled',
        teamARoundWins: Number(r['Team A Wins/Kills'] || r.teamARoundWins || 0),
        teamBRoundWins: Number(r['Team B Wins/Kills'] || r.teamBRoundWins || 0),
        teamAKills: Number(r['Team A Wins/Kills'] || 0),
        teamBKills: Number(r['Team B Wins/Kills'] || 0),
        winnerTeamId: r['Winner ID'] || r.winnerTeamId || undefined,
        scheduledAt: r['Scheduled At'] || new Date().toISOString(),
        notes: r.Notes || r.notes || '',
      });
    });
  }

  return {
    isFullBackup: false,
    tournament,
    teams,
    members,
    matches,
  };
}

/**
 * Parses a ZIP file containing multiple CSVs
 */
export async function parseCSVZip(file: File): Promise<ParsedData> {
  const zip = await JSZip.loadAsync(file);

  // Helper to read CSV text from zip
  const readCsv = async (filename: string): Promise<any[]> => {
    const f = zip.file(filename);
    if (!f) return [];
    const text = await f.async('text');
    const workbook = XLSX.read(text, { type: 'string' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    return firstSheet ? XLSX.utils.sheet_to_json(firstSheet) : [];
  };

  let tournament: Tournament | undefined;
  const tourneyRows = await readCsv('tournament.csv');
  if (tourneyRows.length > 0) {
    const row = tourneyRows[0];
    tournament = {
      id: String(row.id || `TRN-${Date.now().toString(36)}`),
      name: String(row.name || 'Imported Tournament'),
      game: row.game === 'Free Fire' ? 'Free Fire' : 'BGMI',
      mode: row.mode === 'CS' ? 'CS' : 'BR',
      status: row.status || 'In Progress',
      startDate: row.startDate || '',
      endDate: row.endDate || '',
      numMatches: Number(row.numMatches || 0),
      createdAt: row.createdAt || new Date().toISOString(),
    };
  }

  const teamRows = await readCsv('teams.csv');
  const teams: Team[] = teamRows.map((t, idx) => ({
    id: String(t.id || `team-imp-${idx + 1}`),
    teamName: String(t.teamName || `Team ${idx + 1}`),
    teamTag: t.teamTag || undefined,
    captainName: t.captainName || '',
    captainPhone: t.captainPhone || '',
    captainEmail: t.captainEmail || '',
    mode: t.mode || tournament?.mode || 'BR',
    registeredAt: t.registeredAt || new Date().toISOString(),
  }));

  const memberRows = await readCsv('members.csv');
  const members: Record<string, Member[]> = {};
  memberRows.forEach((m, idx) => {
    const teamId = String(m.teamId || '');
    if (!teamId) return;
    if (!members[teamId]) members[teamId] = [];
    members[teamId].push({
      id: String(m.memberId || m.id || `m-imp-${idx + 1}`),
      gameUid: String(m.gameUid || `UID-${idx + 1}`),
      displayName: m.displayName || '',
      ign: m.ign || m.displayName || '',
      email: m.email || undefined,
      isCaptain: String(m.isCaptain).toLowerCase() === 'true',
      isSubstitute: String(m.isSubstitute).toLowerCase() === 'true',
      joinedAt: m.joinedAt || new Date().toISOString(),
    });
  });

  const matchRows = await readCsv('matches.csv');
  const matches: Match[] = matchRows.map((m, idx) => ({
    id: String(m.id || `match-imp-${idx + 1}`),
    roundNumber: Number(m.roundNumber || 1),
    teamAId: String(m.teamAId || ''),
    teamBId: String(m.teamBId || ''),
    mapName: m.mapName || 'Erangel',
    status: (m.status as any) || 'scheduled',
    teamARoundWins: Number(m.teamARoundWins || 0),
    teamBRoundWins: Number(m.teamBRoundWins || 0),
    winnerTeamId: m.winnerTeamId || undefined,
    scheduledAt: m.scheduledAt || new Date().toISOString(),
    notes: m.notes || '',
  }));

  return {
    isFullBackup: false,
    tournament,
    teams,
    members,
    matches,
  };
}

/**
 * Parses raw text from a single spreadsheet CSV template
 */
export async function parseRawCSVText(text: string): Promise<ParsedData> {
  const workbook = XLSX.read(text, { type: 'string' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  if (!rows || rows.length === 0) {
    throw new Error('The uploaded CSV file is empty.');
  }

  const teams: Team[] = [];
  const members: Record<string, Member[]> = {};

  rows.forEach((row, idx) => {
    const teamName = row['Team Name'] || row.teamName || row['Squad Name'] || `Squad ${idx + 1}`;
    const teamId = `team-${Date.now().toString(36)}-${idx + 1}`;
    const teamTag = row['Team Tag'] || row.teamTag || undefined;
    const captainName = row['Captain Name'] || row.captainName || '';
    const captainPhone = row['Captain Phone'] || row.captainPhone || '';
    const captainEmail = row['Captain Email'] || row.captainEmail || '';
    const mode = row.Mode || 'BR';

    teams.push({
      id: teamId,
      teamName: String(teamName),
      teamTag: teamTag ? String(teamTag) : undefined,
      captainName: String(captainName),
      captainPhone: String(captainPhone),
      captainEmail: String(captainEmail),
      mode: mode === 'CS' ? 'CS' : 'BR',
      registeredAt: new Date().toISOString(),
    });

    const roster: Member[] = [];

    // Player 1 (Captain)
    if (row['Player 1 Name'] || row['Player 1 UID']) {
      roster.push({
        id: `m-${teamId}-1`,
        gameUid: String(row['Player 1 UID'] || `UID-P1-${idx + 1}`),
        displayName: String(row['Player 1 Name'] || captainName || 'Player 1'),
        ign: String(row['Player 1 IGN'] || row['Player 1 Name'] || captainName || 'Player 1'),
        email: captainEmail,
        isCaptain: true,
        isSubstitute: false,
        joinedAt: new Date().toISOString(),
      });
    }

    // Players 2 to 4
    for (let p = 2; p <= 4; p++) {
      const pName = row[`Player ${p} Name`];
      const pUid = row[`Player ${p} UID`];
      if (pName || pUid) {
        roster.push({
          id: `m-${teamId}-${p}`,
          gameUid: String(pUid || `UID-P${p}-${idx + 1}`),
          displayName: String(pName || `Player ${p}`),
          ign: String(row[`Player ${p} IGN`] || pName || `Player ${p}`),
          isCaptain: false,
          isSubstitute: false,
          joinedAt: new Date().toISOString(),
        });
      }
    }

    // Substitute
    const subName = row['Substitute Name'] || row['Player 5 Name'];
    const subUid = row['Substitute UID'] || row['Player 5 UID'];
    if (subName || subUid) {
      roster.push({
        id: `m-${teamId}-5`,
        gameUid: String(subUid || `UID-SUB-${idx + 1}`),
        displayName: String(subName || 'Substitute'),
        ign: String(subName || 'Substitute'),
        isCaptain: false,
        isSubstitute: true,
        joinedAt: new Date().toISOString(),
      });
    }

    members[teamId] = roster;
  });

  const tournament: Tournament = {
    id: `trn-csv-${Date.now().toString(36)}`,
    name: 'Imported CSV Roster',
    game: 'BGMI',
    mode: 'BR',
    status: 'In Progress',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    numMatches: 0,
    createdAt: new Date().toISOString(),
  };

  return {
    isFullBackup: false,
    tournament,
    teams,
    members,
    matches: [],
  };
}

/**
 * Validates parsed import structure
 */
export function validateImportData(data: ParsedData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (data.isFullBackup) {
    if (!Array.isArray(data.tournaments) || data.tournaments.length === 0) {
      errors.push('The backup file does not contain any valid tournament records.');
    }
    return { valid: errors.length === 0, errors };
  }

  if (!data.tournament && (!data.teams || data.teams.length === 0)) {
    errors.push('The file does not contain valid tournament or squad roster data.');
  }

  if (data.teams) {
    data.teams.forEach((t, i) => {
      if (!t.teamName || !t.teamName.trim()) {
        errors.push(`Team at row #${i + 1} is missing a required Team Name.`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Downloads a sample CSV Template for bulk squad roster import
 */
export function downloadCSVTemplate(): Blob {
  const sampleHeaders = [
    'Team Name',
    'Team Tag',
    'Captain Name',
    'Captain Phone',
    'Captain Email',
    'Mode',
    'Player 1 Name',
    'Player 1 UID',
    'Player 2 Name',
    'Player 2 UID',
    'Player 3 Name',
    'Player 3 UID',
    'Player 4 Name',
    'Player 4 UID',
    'Substitute Name',
    'Substitute UID',
  ];

  const sampleRows = [
    [
      'Alpha Warriors',
      'AW',
      'Player One',
      '9876543210',
      'player1@example.com',
      'BR',
      'Striker',
      '518293810',
      'Ghost',
      '518293811',
      'Viper',
      '518293812',
      'Hunter',
      '518293813',
      'Blaze',
      '518293814',
    ],
    [
      'Delta Force',
      'DF',
      'Player Two',
      '9876543222',
      'player2@example.com',
      'BR',
      'Apex',
      '528293820',
      'Titan',
      '528293821',
      'Shadow',
      '528293822',
      'Phoenix',
      '528293823',
      'Hawk',
      '528293824',
    ],
  ];

  const csvLines = [
    sampleHeaders.join(','),
    ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(',')),
  ];

  return new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
}

/**
 * Main import runner for a single tournament
 */
export async function importTournament(
  data: ParsedData,
  strategy: ImportStrategy,
  targetTournamentId?: string,
  onProgress?: (status: string, percent: number) => void
): Promise<ImportResult> {
  if (!data.tournament && (!data.teams || data.teams.length === 0)) {
    throw new Error('No tournament data to import.');
  }

  let finalTourneyId = targetTournamentId || data.tournament?.id;

  if (strategy === 'create_new' || !finalTourneyId) {
    const rawName = data.tournament?.name || 'Imported Tournament';
    const newId = `trn-${Date.now().toString(36)}`;
    finalTourneyId = newId;

    onProgress?.('Creating new tournament record...', 10);
    await createTournament({
      id: newId,
      name: strategy === 'create_new' && data.tournament ? `${rawName} (Imported)` : rawName,
      game: data.tournament?.game || 'BGMI',
      mode: data.tournament?.mode || 'BR',
      status: data.tournament?.status || 'In Progress',
      startDate: data.tournament?.startDate || new Date().toISOString().split('T')[0],
      endDate: data.tournament?.endDate || '',
      numMatches: data.tournament?.numMatches || (data.matches?.length || 0),
    });
  } else if (strategy === 'replace') {
    onProgress?.('Replacing existing tournament contents...', 10);
    try {
      await deleteTournament(finalTourneyId);
    } catch (e) {
      console.warn('Replace cleanup note:', e);
    }

    await createTournament({
      id: finalTourneyId,
      name: data.tournament?.name || 'Replaced Tournament',
      game: data.tournament?.game || 'BGMI',
      mode: data.tournament?.mode || 'BR',
      status: data.tournament?.status || 'In Progress',
      startDate: data.tournament?.startDate || new Date().toISOString().split('T')[0],
      endDate: data.tournament?.endDate || '',
      numMatches: data.tournament?.numMatches || (data.matches?.length || 0),
    });
  } else {
    // Strategy: merge
    onProgress?.('Verifying target tournament container...', 10);
    if (data.tournament) {
      await updateTournament(finalTourneyId, {
        name: data.tournament.name,
        game: data.tournament.game,
        mode: data.tournament.mode,
      });
    }
  }

  // 1. Process Teams
  const teamsToImport = data.teams || [];
  const teamIdMap = new Map<string, string>(); // oldId -> newId
  let existingTeams: Team[] = [];

  if (strategy === 'merge') {
    existingTeams = await getTeams(finalTourneyId);
  }

  let importedTeamsCount = 0;
  for (let i = 0; i < teamsToImport.length; i++) {
    const t = teamsToImport[i];
    const progress = 10 + Math.round(((i + 1) / (teamsToImport.length || 1)) * 30);
    onProgress?.(`Importing squad ${i + 1}/${teamsToImport.length}: ${t.teamName}...`, progress);

    const existingMatch = existingTeams.find(
      (et) => et.teamName.trim().toLowerCase() === t.teamName.trim().toLowerCase()
    );

    if (existingMatch && strategy === 'merge') {
      await updateTeam(finalTourneyId, existingMatch.id, {
        teamTag: t.teamTag || existingMatch.teamTag,
        captainName: t.captainName || existingMatch.captainName,
        captainPhone: t.captainPhone || existingMatch.captainPhone,
        captainEmail: t.captainEmail || existingMatch.captainEmail,
      });
      teamIdMap.set(t.id, existingMatch.id);
    } else {
      const createdId = await createTeam(finalTourneyId, {
        teamName: t.teamName,
        teamTag: t.teamTag,
        captainName: t.captainName,
        captainPhone: t.captainPhone,
        captainEmail: t.captainEmail,
        mode: t.mode,
        logoUrl: t.logoUrl,
      });
      teamIdMap.set(t.id, createdId);
      importedTeamsCount++;
    }
  }

  // 2. Process Members
  let importedMembersCount = 0;
  const membersRecord = data.members || {};
  const teamEntries = Object.entries(membersRecord);

  for (let i = 0; i < teamEntries.length; i++) {
    const [oldTeamId, roster] = teamEntries[i];
    const targetTeamId = teamIdMap.get(oldTeamId);
    if (!targetTeamId) continue;

    let existingMembers: Member[] = [];
    if (strategy === 'merge') {
      existingMembers = await getMembers(finalTourneyId, targetTeamId);
    }

    for (const m of roster) {
      const existingM = existingMembers.find((em) => em.gameUid === m.gameUid);
      if (existingM && strategy === 'merge') {
        // Skip duplicate roster member
        continue;
      }
      await createMember(finalTourneyId, targetTeamId, {
        gameUid: m.gameUid,
        displayName: m.displayName,
        ign: m.ign,
        email: m.email,
        isCaptain: m.isCaptain,
        isSubstitute: m.isSubstitute,
      });
      importedMembersCount++;
    }
    const progress = 40 + Math.round(((i + 1) / (teamEntries.length || 1)) * 30);
    onProgress?.(`Importing team members...`, progress);
  }

  // 3. Process Matches
  let importedMatchesCount = 0;
  const matchesToImport = data.matches || [];
  let existingMatches: Match[] = [];
  if (strategy === 'merge') {
    existingMatches = await getMatches(finalTourneyId);
  }

  for (let i = 0; i < matchesToImport.length; i++) {
    const m = matchesToImport[i];
    const teamAId = teamIdMap.get(m.teamAId) || m.teamAId;
    const teamBId = teamIdMap.get(m.teamBId) || m.teamBId;
    const winnerId = m.winnerTeamId ? teamIdMap.get(m.winnerTeamId) || m.winnerTeamId : undefined;

    if (strategy === 'merge') {
      const matchExists = existingMatches.some(
        (em) => em.roundNumber === m.roundNumber && em.teamAId === teamAId && em.teamBId === teamBId
      );
      if (matchExists) continue;
    }

    await createMatch(finalTourneyId, {
      roundNumber: m.roundNumber,
      teamAId,
      teamBId,
      mapName: m.mapName,
      status: m.status,
      teamARoundWins: m.teamARoundWins,
      teamBRoundWins: m.teamBRoundWins,
      teamAKills: m.teamAKills,
      teamBKills: m.teamBKills,
      winnerTeamId: winnerId,
      scheduledAt: m.scheduledAt,
      notes: m.notes,
    });
    importedMatchesCount++;
    const progress = 70 + Math.round(((i + 1) / (matchesToImport.length || 1)) * 20);
    onProgress?.(`Importing matches (${i + 1}/${matchesToImport.length})...`, progress);
  }

  // 4. Registrations & Payments (if present)
  let importedRegistrationsCount = 0;
  if (data.registrations && data.registrations.length > 0) {
    for (const r of data.registrations) {
      await createRegistration({
        ...r,
        tournamentId: finalTourneyId,
      });
      importedRegistrationsCount++;
    }
  }

  let importedPaymentsCount = data.payments ? data.payments.length : 0;

  onProgress?.('Finalizing and logging audit trail...', 95);
  await logAudit('IMPORT_TOURNAMENT', 'tournament', finalTourneyId, {
    strategy,
    importedTeamsCount,
    importedMembersCount,
    importedMatchesCount,
    importedRegistrationsCount,
  });

  onProgress?.('Completed', 100);

  return {
    success: true,
    tournamentId: finalTourneyId,
    importedTeamsCount,
    importedMembersCount,
    importedMatchesCount,
    importedRegistrationsCount,
    importedPaymentsCount,
    message: `Imported ${importedTeamsCount} teams, ${importedMembersCount} members, ${importedMatchesCount} matches successfully.`,
  };
}

/**
 * Restores full database backup
 */
export async function importAllData(
  backup: ParsedData,
  onProgress?: (status: string, percent: number) => void
): Promise<ImportResult> {
  const tournaments = backup.tournaments || [];
  let totalTeams = 0;
  let totalMembers = 0;
  let totalMatches = 0;

  for (let i = 0; i < tournaments.length; i++) {
    const pkg = tournaments[i];
    const progress = Math.round(((i + 1) / (tournaments.length || 1)) * 80);
    onProgress?.(`Restoring tournament ${i + 1}/${tournaments.length}: ${pkg.tournament.name}...`, progress);

    const res = await importTournament(pkg, 'replace', pkg.tournament.id);
    totalTeams += res.importedTeamsCount;
    totalMembers += res.importedMembersCount;
    totalMatches += res.importedMatchesCount;
  }

  // Restore Creator configuration
  if (backup.creatorConfig) {
    onProgress?.('Restoring creator configuration...', 90);
    await saveCreatorConfig(backup.creatorConfig as any);
  }

  onProgress?.('Audit logging...', 98);
  await logAudit('RESTORE_FULL_BACKUP', 'system', 'all', {
    tournamentsCount: tournaments.length,
    totalTeams,
    totalMembers,
  });

  onProgress?.('Complete', 100);

  return {
    success: true,
    importedTeamsCount: totalTeams,
    importedMembersCount: totalMembers,
    importedMatchesCount: totalMatches,
    importedRegistrationsCount: backup.registrations?.length || 0,
    importedPaymentsCount: backup.payments?.length || 0,
    message: `Restored ${tournaments.length} tournaments, ${totalTeams} teams, and ${totalMatches} matches from full backup.`,
  };
}
