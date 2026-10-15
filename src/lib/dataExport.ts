import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import {
  getTournament,
  getTournaments,
  getTeams,
  getMembers,
  getMatches,
  getRegistrations,
} from './firestore';
import { getCreatorConfig } from './creator';
import type { Tournament, Team, Member, Match, Registration, Payment } from '../types';

export interface ExportOptions {
  includeTeams: boolean;
  includeMembers: boolean;
  includeMatches: boolean;
  includeStandings: boolean;
  includeRegistrations: boolean;
  includePayments: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  includeTeams: true,
  includeMembers: true,
  includeMatches: true,
  includeStandings: true,
  includeRegistrations: true,
  includePayments: true,
};

export interface ExportedStandingsRow {
  teamId: string;
  teamName: string;
  played: number;
  wins: number;
  losses: number;
  wwcds: number;
  totalKills: number;
  placementPts: number;
  grandTotal: number;
}

export interface TournamentExportPackage {
  formatVersion: string;
  exportedAt: string;
  exportedBy: string;
  tournament: Tournament;
  teams?: Team[];
  members?: Record<string, Member[]>;
  matches?: Match[];
  standings?: ExportedStandingsRow[];
  registrations?: Registration[];
  payments?: Payment[];
}

export function computeStandingsForExport(
  teams: Team[],
  matches: Match[]
): ExportedStandingsRow[] {
  const map = new Map<string, ExportedStandingsRow>();

  teams.forEach((t) => {
    map.set(t.id, {
      teamId: t.id,
      teamName: t.teamName,
      played: 0,
      wins: 0,
      losses: 0,
      wwcds: 0,
      totalKills: 0,
      placementPts: 0,
      grandTotal: 0,
    });
  });

  matches.forEach((m) => {
    if (m.status !== 'done') return;

    const rowA = map.get(m.teamAId);
    const rowB = map.get(m.teamBId);

    if (rowA) {
      rowA.played += 1;
      const killsA = m.teamAKills ?? (m.teamARoundWins ? m.teamARoundWins * 2 : 0);
      rowA.totalKills += killsA;

      const wonA = m.winnerTeamId === m.teamAId || (m.teamAPlacement === 1) || (m.teamARoundWins || 0) >= 4;
      if (wonA) {
        rowA.wins += 1;
        rowA.wwcds += 1;
        rowA.placementPts += 15;
      } else {
        rowA.losses += 1;
        rowA.placementPts += 6;
      }
      rowA.grandTotal = rowA.totalKills + rowA.placementPts;
    }

    if (rowB) {
      rowB.played += 1;
      const killsB = m.teamBKills ?? (m.teamBRoundWins ? m.teamBRoundWins * 2 : 0);
      rowB.totalKills += killsB;

      const wonB = m.winnerTeamId === m.teamBId || (m.teamBPlacement === 1) || (m.teamBRoundWins || 0) >= 4;
      if (wonB) {
        rowB.wins += 1;
        rowB.wwcds += 1;
        rowB.placementPts += 15;
      } else {
        rowB.losses += 1;
        rowB.placementPts += 6;
      }
      rowB.grandTotal = rowB.totalKills + rowB.placementPts;
    }
  });

  const list = Array.from(map.values());
  list.sort((a, b) => b.grandTotal - a.grandTotal || b.wwcds - a.wwcds || b.totalKills - a.totalKills);
  return list;
}

export async function fetchTournamentDataPackage(
  tournamentId: string,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  exportedBy: string = 'admin'
): Promise<TournamentExportPackage> {
  const tournament = await getTournament(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament with ID "${tournamentId}" not found.`);
  }

  const pkg: TournamentExportPackage = {
    formatVersion: '1.0',
    exportedAt: new Date().toISOString(),
    exportedBy,
    tournament,
  };

  let teams: Team[] = [];
  if (options.includeTeams || options.includeMembers || options.includeStandings) {
    teams = await getTeams(tournamentId);
    if (options.includeTeams) {
      pkg.teams = teams;
    }
  }

  if (options.includeMembers && teams.length > 0) {
    const membersMap: Record<string, Member[]> = {};
    for (const team of teams) {
      const roster = await getMembers(tournamentId, team.id);
      membersMap[team.id] = roster;
    }
    pkg.members = membersMap;
  }

  let matches: Match[] = [];
  if (options.includeMatches || options.includeStandings) {
    matches = await getMatches(tournamentId);
    if (options.includeMatches) {
      pkg.matches = matches;
    }
  }

  if (options.includeStandings) {
    pkg.standings = computeStandingsForExport(teams, matches);
  }

  if (options.includeRegistrations) {
    const regs = await getRegistrations({ tournamentId });
    pkg.registrations = regs;
  }

  if (options.includePayments) {
    pkg.payments = [];
  }

  return pkg;
}

/**
 * 1. Export tournament to JSON Blob
 */
export async function exportTournamentToJSON(
  tournamentId: string,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  exportedBy: string = 'admin'
): Promise<Blob> {
  const data = await fetchTournamentDataPackage(tournamentId, options, exportedBy);
  const jsonStr = JSON.stringify(data, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

/**
 * 2. Export tournament to Multi-Sheet Excel Blob
 */
export async function exportTournamentToExcel(
  tournamentId: string,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  exportedBy: string = 'admin'
): Promise<Blob> {
  const pkg = await fetchTournamentDataPackage(tournamentId, options, exportedBy);
  const workbook = XLSX.utils.book_new();

  // Sheet 1: Tournament
  const tournamentRows = [
    {
      'Tournament ID': pkg.tournament.id,
      'Tournament Name': pkg.tournament.name,
      Game: pkg.tournament.game,
      Mode: pkg.tournament.mode,
      Status: pkg.tournament.status,
      'Start Date': pkg.tournament.startDate || '',
      'End Date': pkg.tournament.endDate || '',
      'Total Matches': pkg.tournament.numMatches || 0,
      'Created At': pkg.tournament.createdAt || '',
      'Exported At': pkg.exportedAt,
      'Exported By': pkg.exportedBy,
    },
  ];
  const wsTournament = XLSX.utils.json_to_sheet(tournamentRows);
  XLSX.utils.book_append_sheet(workbook, wsTournament, 'Tournament');

  // Sheet 2: Teams
  if (pkg.teams && pkg.teams.length > 0) {
    const teamRows = pkg.teams.map((t) => ({
      'Team ID': t.id,
      'Team Name': t.teamName,
      'Team Tag': t.teamTag || '',
      'Captain Name': t.captainName || '',
      'Captain Phone': t.captainPhone || '',
      'Captain Email': t.captainEmail || '',
      Mode: t.mode || '',
      'Registered At': t.registeredAt || '',
    }));
    const wsTeams = XLSX.utils.json_to_sheet(teamRows);
    XLSX.utils.book_append_sheet(workbook, wsTeams, 'Teams');
  }

  // Sheet 3: Members
  if (pkg.members && Object.keys(pkg.members).length > 0) {
    const teamNameMap = new Map((pkg.teams || []).map((t) => [t.id, t.teamName]));
    const memberRows: Array<Record<string, unknown>> = [];
    Object.entries(pkg.members).forEach(([teamId, roster]) => {
      roster.forEach((m) => {
        memberRows.push({
          'Team ID': teamId,
          'Team Name': teamNameMap.get(teamId) || teamId,
          'Member ID': m.id,
          'Game UID': m.gameUid,
          'Display Name': m.displayName || '',
          IGN: m.ign || '',
          Email: m.email || '',
          Captain: m.isCaptain ? 'YES' : 'NO',
          Substitute: m.isSubstitute ? 'YES' : 'NO',
          'Joined At': m.joinedAt || '',
        });
      });
    });
    if (memberRows.length > 0) {
      const wsMembers = XLSX.utils.json_to_sheet(memberRows);
      XLSX.utils.book_append_sheet(workbook, wsMembers, 'Members');
    }
  }

  // Sheet 4: Matches
  if (pkg.matches && pkg.matches.length > 0) {
    const teamNameMap = new Map((pkg.teams || []).map((t) => [t.id, t.teamName]));
    const matchRows = pkg.matches.map((m) => ({
      'Match ID': m.id,
      Round: m.roundNumber || 1,
      'Team A ID': m.teamAId,
      'Team A Name': teamNameMap.get(m.teamAId) || m.teamAId,
      'Team B ID': m.teamBId,
      'Team B Name': teamNameMap.get(m.teamBId) || m.teamBId,
      Map: m.mapName || '',
      Status: m.status,
      'Team A Wins/Kills': m.teamARoundWins || m.teamAKills || 0,
      'Team B Wins/Kills': m.teamBRoundWins || m.teamBKills || 0,
      'Winner ID': m.winnerTeamId || '',
      'Scheduled At': m.scheduledAt || '',
      Notes: m.notes || '',
    }));
    const wsMatches = XLSX.utils.json_to_sheet(matchRows);
    XLSX.utils.book_append_sheet(workbook, wsMatches, 'Matches');
  }

  // Sheet 5: Standings
  if (pkg.standings && pkg.standings.length > 0) {
    const standingRows = pkg.standings.map((s, idx) => ({
      Rank: idx + 1,
      'Team Name': s.teamName,
      'Team ID': s.teamId,
      Played: s.played,
      Wins: s.wins,
      Losses: s.losses,
      WWCDs: s.wwcds,
      'Total Kills': s.totalKills,
      'Placement Pts': s.placementPts,
      'Grand Total': s.grandTotal,
    }));
    const wsStandings = XLSX.utils.json_to_sheet(standingRows);
    XLSX.utils.book_append_sheet(workbook, wsStandings, 'Standings');
  }

  // Sheet 6: Registrations
  if (pkg.registrations && pkg.registrations.length > 0) {
    const regRows = pkg.registrations.map((r) => ({
      'Registration ID': r.id,
      'Team Name': r.teamName,
      'Team Tag': r.teamTag || '',
      Game: r.game,
      Mode: r.mode,
      'Captain Name': r.captainName,
      'Captain Email': r.captainEmail,
      'Captain Phone': r.captainPhone,
      Status: r.status,
      'Payment Status': r.paymentStatus,
      UTR: r.upiTransactionId || '',
      'Submitted At': r.submittedAt,
    }));
    const wsRegs = XLSX.utils.json_to_sheet(regRows);
    XLSX.utils.book_append_sheet(workbook, wsRegs, 'Registrations');
  }

  // Sheet 7: Payments
  if (pkg.payments && pkg.payments.length > 0) {
    const payRows = pkg.payments.map((p) => ({
      'Payment ID': p.id,
      'Team Name': p.teamName,
      'Captain Email': p.captainEmail,
      Amount: p.amount,
      UTR: p.utr,
      Status: p.verificationStatus,
      'Paid At': p.paidAt,
      Notes: p.notes || '',
    }));
    const wsPayments = XLSX.utils.json_to_sheet(payRows);
    XLSX.utils.book_append_sheet(workbook, wsPayments, 'Payments');
  }

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/**
 * 3. Export tournament as a Zip file containing individual CSV files
 */
export async function exportTournamentToCSVZip(
  tournamentId: string,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS,
  exportedBy: string = 'admin'
): Promise<Blob> {
  const pkg = await fetchTournamentDataPackage(tournamentId, options, exportedBy);
  const zip = new JSZip();

  // Helper to convert array of objects to CSV string
  const toCsv = (rows: Array<Record<string, unknown>>) => {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const csvLines = [headers.join(',')];
    rows.forEach((row) => {
      const line = headers
        .map((h) => {
          const val = row[h] === undefined || row[h] === null ? '' : String(row[h]);
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(',');
      csvLines.push(line);
    });
    return csvLines.join('\n');
  };

  // tournament.csv
  const tourneyRows = [
    {
      id: pkg.tournament.id,
      name: pkg.tournament.name,
      game: pkg.tournament.game,
      mode: pkg.tournament.mode,
      status: pkg.tournament.status,
      startDate: pkg.tournament.startDate || '',
      endDate: pkg.tournament.endDate || '',
      numMatches: pkg.tournament.numMatches || 0,
      createdAt: pkg.tournament.createdAt || '',
    },
  ];
  zip.file('tournament.csv', toCsv(tourneyRows));

  // teams.csv
  if (pkg.teams && pkg.teams.length > 0) {
    const teamRows = pkg.teams.map((t) => ({
      id: t.id,
      teamName: t.teamName,
      teamTag: t.teamTag || '',
      captainName: t.captainName || '',
      captainPhone: t.captainPhone || '',
      captainEmail: t.captainEmail || '',
      mode: t.mode || '',
      registeredAt: t.registeredAt || '',
    }));
    zip.file('teams.csv', toCsv(teamRows));
  }

  // members.csv
  if (pkg.members && Object.keys(pkg.members).length > 0) {
    const memberRows: Array<Record<string, unknown>> = [];
    Object.entries(pkg.members).forEach(([teamId, roster]) => {
      roster.forEach((m) => {
        memberRows.push({
          teamId,
          memberId: m.id,
          gameUid: m.gameUid,
          displayName: m.displayName || '',
          ign: m.ign || '',
          email: m.email || '',
          isCaptain: m.isCaptain ? 'true' : 'false',
          isSubstitute: m.isSubstitute ? 'true' : 'false',
          joinedAt: m.joinedAt || '',
        });
      });
    });
    if (memberRows.length > 0) {
      zip.file('members.csv', toCsv(memberRows));
    }
  }

  // matches.csv
  if (pkg.matches && pkg.matches.length > 0) {
    const matchRows = pkg.matches.map((m) => ({
      id: m.id,
      roundNumber: m.roundNumber || 1,
      teamAId: m.teamAId,
      teamBId: m.teamBId,
      mapName: m.mapName || '',
      status: m.status,
      teamARoundWins: m.teamARoundWins || 0,
      teamBRoundWins: m.teamBRoundWins || 0,
      winnerTeamId: m.winnerTeamId || '',
      scheduledAt: m.scheduledAt || '',
      notes: m.notes || '',
    }));
    zip.file('matches.csv', toCsv(matchRows));
  }

  // standings.csv
  if (pkg.standings && pkg.standings.length > 0) {
    const standingRows = pkg.standings.map((s, idx) => ({
      rank: idx + 1,
      teamId: s.teamId,
      teamName: s.teamName,
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      wwcds: s.wwcds,
      totalKills: s.totalKills,
      placementPts: s.placementPts,
      grandTotal: s.grandTotal,
    }));
    zip.file('standings.csv', toCsv(standingRows));
  }

  // registrations.csv
  if (pkg.registrations && pkg.registrations.length > 0) {
    const regRows = pkg.registrations.map((r) => ({
      id: r.id,
      teamName: r.teamName,
      teamTag: r.teamTag || '',
      captainName: r.captainName,
      captainEmail: r.captainEmail,
      captainPhone: r.captainPhone,
      status: r.status,
      paymentStatus: r.paymentStatus,
      upiTransactionId: r.upiTransactionId || '',
      submittedAt: r.submittedAt,
    }));
    zip.file('registrations.csv', toCsv(regRows));
  }

  // payments.csv
  if (pkg.payments && pkg.payments.length > 0) {
    const payRows = pkg.payments.map((p) => ({
      id: p.id,
      teamName: p.teamName,
      captainEmail: p.captainEmail,
      amount: p.amount,
      utr: p.utr,
      verificationStatus: p.verificationStatus,
      paidAt: p.paidAt,
    }));
    zip.file('payments.csv', toCsv(payRows));
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * 4. Full System Backup (all tournaments + configs + accounts)
 */
export async function exportAllData(exportedBy: string = 'admin'): Promise<Blob> {
  const allTournaments = await getTournaments();
  const tournamentsData: TournamentExportPackage[] = [];

  for (const t of allTournaments) {
    try {
      const pkg = await fetchTournamentDataPackage(t.id, DEFAULT_EXPORT_OPTIONS, exportedBy);
      tournamentsData.push(pkg);
    } catch (err) {
      console.warn(`Skipping tournament ${t.id} in full backup:`, err);
    }
  }

  const allRegistrations = await getRegistrations();
  const allPayments: Payment[] = [];
  const creatorConfig = await getCreatorConfig();

  const fullBackup = {
    formatVersion: '1.0',
    backupType: 'full',
    exportedAt: new Date().toISOString(),
    exportedBy,
    tournamentsCount: tournamentsData.length,
    tournaments: tournamentsData,
    registrations: allRegistrations,
    payments: allPayments,
    creatorConfig: creatorConfig
      ? {
          creatorEmail: creatorConfig.creatorEmail,
          adminEmails: creatorConfig.adminEmails,
          publicViewerEnabled: creatorConfig.publicViewerEnabled,
          publicPasswordRequired: creatorConfig.publicPasswordRequired,
          updatedAt: creatorConfig.updatedAt,
        }
      : null,
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  return new Blob([jsonStr], { type: 'application/json' });
}

/**
 * Triggers client browser download for any Blob
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
