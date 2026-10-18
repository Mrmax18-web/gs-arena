import {
  FirestoreDataConverter,
  QueryDocumentSnapshot,
  SnapshotOptions,
} from 'firebase/firestore';
import { Tournament, Match, Team } from '../types/tournament';
import { Registration } from '../types/registration';
import { SystemConfig, BackgroundConfig } from '../types/config';
import { GameConfig } from '../types/game';
import { AdminRequest } from '../types/auth';
import { DEFAULT_BACKGROUND_CONFIG, DEFAULT_SYSTEM_CONFIG, DEFAULT_MVP_WEIGHTS } from './constants';

export const tournamentConverter: FirestoreDataConverter<Tournament> = {
  toFirestore(tournament: Tournament) {
    return {
      name: tournament.name ?? '',
      gameId: tournament.gameId ?? 'BGMI',
      status: tournament.status ?? 'draft',
      registrationOpen: Boolean(tournament.registrationOpen),
      rosterSize: tournament.rosterSize ?? 4,
      scoringSnapshot: {
        placementPoints: tournament.scoringSnapshot?.placementPoints ?? [],
        killPoints: tournament.scoringSnapshot?.killPoints ?? 1,
        matchWinPoints: tournament.scoringSnapshot?.matchWinPoints ?? 1,
        mvpWeights: tournament.scoringSnapshot?.mvpWeights ?? { ...DEFAULT_MVP_WEIGHTS },
      },
      entryFeePaise: typeof tournament.entryFeePaise === 'number' ? Math.floor(tournament.entryFeePaise) : 0,
      upiQrUrl: tournament.upiQrUrl ?? null,
      upiId: tournament.upiId ?? null,
      isDemo: Boolean(tournament.isDemo),
      createdAt: tournament.createdAt ?? new Date().toISOString(),
      updatedAt: tournament.updatedAt ?? new Date().toISOString(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Tournament {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      name: data?.name ?? 'Untitled Tournament',
      gameId: data?.gameId ?? 'BGMI',
      status: data?.status ?? 'draft',
      registrationOpen: Boolean(data?.registrationOpen),
      rosterSize: data?.rosterSize ?? 4,
      scoringSnapshot: {
        placementPoints: Array.isArray(data?.scoringSnapshot?.placementPoints)
          ? data.scoringSnapshot.placementPoints
          : [],
        killPoints: data?.scoringSnapshot?.killPoints ?? 1,
        matchWinPoints: data?.scoringSnapshot?.matchWinPoints ?? 1,
        mvpWeights: {
          kills: data?.scoringSnapshot?.mvpWeights?.kills ?? DEFAULT_MVP_WEIGHTS.kills,
          damage: data?.scoringSnapshot?.mvpWeights?.damage ?? DEFAULT_MVP_WEIGHTS.damage,
          assists: data?.scoringSnapshot?.mvpWeights?.assists ?? DEFAULT_MVP_WEIGHTS.assists,
          survivalSeconds: data?.scoringSnapshot?.mvpWeights?.survivalSeconds ?? DEFAULT_MVP_WEIGHTS.survivalSeconds,
          revives: data?.scoringSnapshot?.mvpWeights?.revives ?? DEFAULT_MVP_WEIGHTS.revives,
        },
      },
      entryFeePaise: typeof data?.entryFeePaise === 'number' ? data.entryFeePaise : 0,
      upiQrUrl: data?.upiQrUrl ?? undefined,
      upiId: data?.upiId ?? undefined,
      isDemo: Boolean(data?.isDemo),
      createdAt: data?.createdAt ?? '',
      updatedAt: data?.updatedAt ?? '',
    };
  },
};

export const matchConverter: FirestoreDataConverter<Match> = {
  toFirestore(match: Match) {
    return {
      tournamentId: match.tournamentId ?? '',
      matchNumber: match.matchNumber ?? 1,
      scheduledAt: match.scheduledAt ?? new Date().toISOString(),
      map: match.map ?? 'Erangel',
      status: match.status ?? 'scheduled',
      results: (match.results || []).map((r) => ({
        teamId: r?.teamId ?? '',
        teamName: r?.teamName ?? '',
        placement: r?.placement ?? 0,
        kills: r?.kills ?? 0,
        placementPoints: r?.placementPoints ?? 0,
        killPoints: r?.killPoints ?? 0,
        totalPoints: r?.totalPoints ?? 0,
        roundsWon: r?.roundsWon ?? 0,
        roundsLost: r?.roundsLost ?? 0,
        playerStats: (r?.playerStats || []).map((p) => ({
          playerId: p?.playerId ?? '',
          playerName: p?.playerName ?? '',
          kills: p?.kills ?? 0,
          damage: p?.damage ?? 0,
          assists: p?.assists ?? 0,
          survivalSeconds: p?.survivalSeconds ?? 0,
          revives: p?.revives ?? 0,
          mvpScore: p?.mvpScore ?? 0,
        })),
      })),
      isDemo: Boolean(match.isDemo),
      createdAt: match.createdAt ?? new Date().toISOString(),
      updatedAt: match.updatedAt ?? new Date().toISOString(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Match {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      tournamentId: data?.tournamentId ?? '',
      matchNumber: data?.matchNumber ?? 1,
      scheduledAt: data?.scheduledAt ?? '',
      map: data?.map ?? 'Unknown Map',
      status: data?.status ?? 'scheduled',
      results: Array.isArray(data?.results)
        ? data.results.map((r: any) => ({
            teamId: r?.teamId ?? '',
            teamName: r?.teamName ?? '',
            placement: r?.placement ?? 0,
            kills: r?.kills ?? 0,
            placementPoints: r?.placementPoints ?? 0,
            killPoints: r?.killPoints ?? 0,
            totalPoints: r?.totalPoints ?? 0,
            roundsWon: r?.roundsWon ?? 0,
            roundsLost: r?.roundsLost ?? 0,
            playerStats: Array.isArray(r?.playerStats)
              ? r.playerStats.map((p: any) => ({
                  playerId: p?.playerId ?? '',
                  playerName: p?.playerName ?? '',
                  kills: p?.kills ?? 0,
                  damage: p?.damage ?? 0,
                  assists: p?.assists ?? 0,
                  survivalSeconds: p?.survivalSeconds ?? 0,
                  revives: p?.revives ?? 0,
                  mvpScore: p?.mvpScore ?? 0,
                }))
              : [],
          }))
        : [],
      isDemo: Boolean(data?.isDemo),
      createdAt: data?.createdAt ?? '',
      updatedAt: data?.updatedAt ?? '',
    };
  },
};

export const teamConverter: FirestoreDataConverter<Team> = {
  toFirestore(team: Team) {
    return {
      tournamentId: team.tournamentId ?? '',
      teamName: team.teamName ?? '',
      players: team.players ?? [],
      createdAt: team.createdAt ?? new Date().toISOString(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Team {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      tournamentId: data?.tournamentId ?? '',
      teamName: data?.teamName ?? '',
      players: Array.isArray(data?.players) ? data.players : [],
      createdAt: data?.createdAt ?? '',
    };
  },
};

export const registrationConverter: FirestoreDataConverter<Registration> = {
  toFirestore(reg: Registration) {
    const approval = reg.approvalStatus ?? reg.status ?? 'pending';
    const payment = reg.paymentStatus ?? 'pending';
    return {
      tournamentId: reg.tournamentId,
      teamName: reg.teamName,
      leaderEmail: reg.leaderEmail,
      players: reg.players,
      ownerUid: reg.ownerUid,
      status: approval,
      approvalStatus: approval,
      paymentStatus: payment,
      otr: (reg.otr || '').trim().toUpperCase(),
      paymentScreenshotUrl: reg.paymentScreenshotUrl ?? '',
      teamLogoUrl: reg.teamLogoUrl ?? null,
      rulesVersion: reg.rulesVersion ?? '1.0',
      acceptedAt: reg.acceptedAt ?? new Date().toISOString(),
      reviewedBy: reg.reviewedBy ?? null,
      reviewedAt: reg.reviewedAt ?? null,
      reviewNote: reg.reviewNote ?? null,
      paymentReviewedBy: reg.paymentReviewedBy ?? null,
      paymentReviewedAt: reg.paymentReviewedAt ?? null,
      paymentReviewNote: reg.paymentReviewNote ?? null,
      createdAt: reg.createdAt ?? new Date().toISOString(),
      updatedAt: reg.updatedAt ?? new Date().toISOString(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): Registration {
    const data = snapshot.data(options);
    const resolvedApproval = (data?.approvalStatus ?? data?.status ?? 'pending') as any;
    const resolvedPayment = (data?.paymentStatus ?? 'pending') as any;
    return {
      id: snapshot.id,
      tournamentId: data?.tournamentId ?? '',
      teamName: data?.teamName ?? '',
      leaderEmail: data?.leaderEmail ?? '',
      players: Array.isArray(data?.players) ? data.players : [],
      ownerUid: data?.ownerUid ?? '',
      status: resolvedApproval,
      approvalStatus: resolvedApproval,
      paymentStatus: resolvedPayment,
      otr: data?.otr ?? '',
      paymentScreenshotUrl: data?.paymentScreenshotUrl ?? '',
      teamLogoUrl: data?.teamLogoUrl ?? undefined,
      rulesVersion: data?.rulesVersion ?? '1.0',
      acceptedAt: data?.acceptedAt ?? '',
      reviewedBy: data?.reviewedBy ?? undefined,
      reviewedAt: data?.reviewedAt ?? undefined,
      reviewNote: data?.reviewNote ?? undefined,
      paymentReviewedBy: data?.paymentReviewedBy ?? undefined,
      paymentReviewedAt: data?.paymentReviewedAt ?? undefined,
      paymentReviewNote: data?.paymentReviewNote ?? undefined,
      createdAt: data?.createdAt ?? '',
      updatedAt: data?.updatedAt ?? '',
    };
  },
};

export const adminRequestConverter: FirestoreDataConverter<AdminRequest> = {
  toFirestore(req: AdminRequest) {
    return {
      uid: req.uid,
      name: req.name,
      email: req.email,
      reason: req.reason,
      contact: req.contact,
      status: req.status ?? 'pending',
      reviewedBy: req.reviewedBy ?? null,
      reviewedAt: req.reviewedAt ?? null,
      reviewNote: req.reviewNote ?? null,
      createdAt: req.createdAt ?? new Date().toISOString(),
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): AdminRequest {
    const data = snapshot.data(options);
    return {
      uid: snapshot.id,
      name: data?.name ?? '',
      email: data?.email ?? '',
      reason: data?.reason ?? '',
      contact: data?.contact ?? '',
      status: data?.status ?? 'pending',
      reviewedBy: data?.reviewedBy ?? undefined,
      reviewedAt: data?.reviewedAt ?? undefined,
      reviewNote: data?.reviewNote ?? undefined,
      createdAt: data?.createdAt ?? '',
    };
  },
};

export const systemConfigConverter: FirestoreDataConverter<SystemConfig> = {
  toFirestore(cfg: SystemConfig) {
    return {
      siteName: cfg.siteName ?? DEFAULT_SYSTEM_CONFIG.siteName,
      logos: cfg.logos ?? DEFAULT_SYSTEM_CONFIG.logos,
      appearance: cfg.appearance ?? {
        bgmiIconUrl: '',
        ffIconUrl: '',
        arenaLogoUrl: '',
      },
      viewerBaseUrl: cfg.viewerBaseUrl ?? '',
      faqItems: cfg.faqItems ?? DEFAULT_SYSTEM_CONFIG.faqItems,
      contactText: cfg.contactText ?? DEFAULT_SYSTEM_CONFIG.contactText,
      contactEmail: cfg.contactEmail ?? DEFAULT_SYSTEM_CONFIG.contactEmail,
      registrationEnabled: cfg.registrationEnabled ?? true,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): SystemConfig {
    const data = snapshot.data(options);
    return {
      siteName: data?.siteName ?? DEFAULT_SYSTEM_CONFIG.siteName,
      logos: {
        dark: data?.logos?.dark ?? DEFAULT_SYSTEM_CONFIG.logos.dark,
        light: data?.logos?.light ?? DEFAULT_SYSTEM_CONFIG.logos.light,
        mark: data?.logos?.mark ?? DEFAULT_SYSTEM_CONFIG.logos.mark,
      },
      appearance: {
        bgmiIconUrl: data?.appearance?.bgmiIconUrl ?? '',
        ffIconUrl: data?.appearance?.ffIconUrl ?? '',
        arenaLogoUrl: data?.appearance?.arenaLogoUrl ?? '',
      },
      viewerBaseUrl: data?.viewerBaseUrl ?? '',
      faqItems: Array.isArray(data?.faqItems) ? data.faqItems : DEFAULT_SYSTEM_CONFIG.faqItems,
      contactText: data?.contactText ?? DEFAULT_SYSTEM_CONFIG.contactText,
      contactEmail: data?.contactEmail ?? DEFAULT_SYSTEM_CONFIG.contactEmail,
      registrationEnabled: data?.registrationEnabled ?? true,
    };
  },
};

export const backgroundConfigConverter: FirestoreDataConverter<BackgroundConfig> = {
  toFirestore(cfg: BackgroundConfig) {
    return {
      enabled: cfg.enabled ?? true,
      background: cfg.background ?? DEFAULT_BACKGROUND_CONFIG.background,
      baseColor: cfg.baseColor ?? DEFAULT_BACKGROUND_CONFIG.baseColor,
      accentColor: cfg.accentColor ?? DEFAULT_BACKGROUND_CONFIG.accentColor,
      speed: cfg.speed ?? DEFAULT_BACKGROUND_CONFIG.speed,
      scale: cfg.scale ?? DEFAULT_BACKGROUND_CONFIG.scale,
      hover: cfg.hover ?? DEFAULT_BACKGROUND_CONFIG.hover,
      colorSplit: cfg.colorSplit ?? DEFAULT_BACKGROUND_CONFIG.colorSplit,
      ribbonGrain: cfg.ribbonGrain ?? DEFAULT_BACKGROUND_CONFIG.ribbonGrain,
      colors: cfg.colors ?? DEFAULT_BACKGROUND_CONFIG.colors,
      density: cfg.density ?? DEFAULT_BACKGROUND_CONFIG.density,
      angle: cfg.angle ?? DEFAULT_BACKGROUND_CONFIG.angle,
      opacity: cfg.opacity ?? DEFAULT_BACKGROUND_CONFIG.opacity,
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): BackgroundConfig {
    const data = snapshot.data(options);
    return {
      enabled: data?.enabled ?? true,
      background: data?.background ?? DEFAULT_BACKGROUND_CONFIG.background,
      baseColor: data?.baseColor ?? DEFAULT_BACKGROUND_CONFIG.baseColor,
      accentColor: data?.accentColor ?? DEFAULT_BACKGROUND_CONFIG.accentColor,
      speed: typeof data?.speed === 'number' ? data.speed : DEFAULT_BACKGROUND_CONFIG.speed,
      scale: typeof data?.scale === 'number' ? data.scale : DEFAULT_BACKGROUND_CONFIG.scale,
      hover: typeof data?.hover === 'number' ? data.hover : DEFAULT_BACKGROUND_CONFIG.hover,
      colorSplit: typeof data?.colorSplit === 'number' ? data.colorSplit : DEFAULT_BACKGROUND_CONFIG.colorSplit,
      ribbonGrain: typeof data?.ribbonGrain === 'number' ? data.ribbonGrain : DEFAULT_BACKGROUND_CONFIG.ribbonGrain,
      colors: Array.isArray(data?.colors) && data.colors.length >= 2 ? data.colors : DEFAULT_BACKGROUND_CONFIG.colors,
      density: typeof data?.density === 'number' ? data.density : DEFAULT_BACKGROUND_CONFIG.density,
      angle: typeof data?.angle === 'number' ? data.angle : DEFAULT_BACKGROUND_CONFIG.angle,
      opacity: typeof data?.opacity === 'number' ? data.opacity : DEFAULT_BACKGROUND_CONFIG.opacity,
    };
  },
};

export const gameConfigConverter: FirestoreDataConverter<GameConfig> = {
  toFirestore(cfg: GameConfig) {
    return {
      name: cfg.name,
      mode: cfg.mode,
      placementPoints: cfg.placementPoints ?? [],
      killPoints: cfg.killPoints ?? 0,
      matchWinPoints: cfg.matchWinPoints ?? 1,
      mvpWeights: cfg.mvpWeights ?? DEFAULT_MVP_WEIGHTS,
      rules: cfg.rules ?? '',
    };
  },
  fromFirestore(snapshot: QueryDocumentSnapshot, options?: SnapshotOptions): GameConfig {
    const data = snapshot.data(options);
    return {
      id: snapshot.id as any,
      name: data?.name ?? snapshot.id,
      mode: data?.mode ?? 'Battle Royale',
      placementPoints: Array.isArray(data?.placementPoints) ? data.placementPoints : [],
      killPoints: data?.killPoints ?? 0,
      matchWinPoints: data?.matchWinPoints ?? 1,
      mvpWeights: {
        kills: data?.mvpWeights?.kills ?? DEFAULT_MVP_WEIGHTS.kills,
        damage: data?.mvpWeights?.damage ?? DEFAULT_MVP_WEIGHTS.damage,
        assists: data?.mvpWeights?.assists ?? DEFAULT_MVP_WEIGHTS.assists,
        survivalSeconds: data?.mvpWeights?.survivalSeconds ?? DEFAULT_MVP_WEIGHTS.survivalSeconds,
        revives: data?.mvpWeights?.revives ?? DEFAULT_MVP_WEIGHTS.revives,
      },
      rules: data?.rules ?? '',
    };
  },
};
