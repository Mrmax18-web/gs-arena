import { z } from 'zod';
import {
  sanitizeInputString,
  containsProfanity,
  containsScriptTag,
} from './moderation';

export const OTR_REGEX = /^[A-Z0-9_-]{6,40}$/;

export const RegistrationSchema = z.object({
  tournamentId: z.string().min(1, 'Please select a tournament'),
  teamName: z
    .string()
    .transform(sanitizeInputString)
    .pipe(
      z
        .string()
        .min(2, 'Team name must be at least 2 characters')
        .max(40, 'Team name cannot exceed 40 characters')
        .refine((v) => !containsScriptTag(v), {
          message: 'Team name cannot contain script tags or markup',
        })
        .refine((v) => !containsProfanity(v), {
          message: 'Team name contains prohibited or abusive language',
        })
    ),
  leaderEmail: z
    .string()
    .email('Please enter a valid email address')
    .max(100, 'Email cannot exceed 100 characters')
    .trim(),
  players: z
    .array(
      z
        .string()
        .transform(sanitizeInputString)
        .pipe(
          z
            .string()
            .min(2, 'Player name/ID must be at least 2 characters')
            .max(30, 'Player name/ID cannot exceed 30 characters')
            .refine((v) => !containsScriptTag(v), {
              message: 'Player ID cannot contain script tags or markup',
            })
            .refine((v) => !containsProfanity(v), {
              message: 'Player ID contains prohibited or abusive language',
            })
        )
    )
    .length(4, 'Registration requires exactly 4 player IDs')
    .refine((items) => {
      const lower = items.map((i) => i.toLowerCase());
      return new Set(lower).size === lower.length;
    }, { message: 'Player IDs must be unique within the team' }),
  otr: z
    .string()
    .transform(sanitizeInputString)
    .transform((val) => val.toUpperCase())
    .refine((val) => OTR_REGEX.test(val), {
      message: 'OTR (Order/Transaction Reference) must be 6-40 characters (letters, numbers, hyphens, underscores)',
    }),
  paymentScreenshotUrl: z
    .string()
    .min(1, 'Payment screenshot proof is required')
    .url('Payment screenshot must be a valid URL'),
  teamLogoUrl: z
    .string()
    .url('Team logo must be a valid URL')
    .optional()
    .or(z.literal('')),
  rulesAccepted: z.literal(true, {
    errorMap: () => ({ message: 'You must acknowledge and accept the tournament rules' }),
  }),
});

export type RegistrationFormInput = z.infer<typeof RegistrationSchema>;

export const AppearanceSchema = z.object({
  siteName: z
    .string()
    .transform(sanitizeInputString)
    .pipe(
      z
        .string()
        .max(50, 'Site name cannot exceed 50 characters')
        .refine((v) => !containsScriptTag(v), {
          message: 'Site name cannot contain script tags or markup',
        })
        .refine((v) => !containsProfanity(v), {
          message: 'Site name contains prohibited or abusive language',
        })
    )
    .optional()
    .or(z.literal('')),
  bgmiIconUrl: z
    .string()
    .max(1000, 'URL too long')
    .refine((val) => !val || (val.startsWith('https://') && /^https:\/\/[^\s]+$/.test(val)), {
      message: 'Must be a valid HTTPS URL',
    })
    .optional()
    .or(z.literal('')),
  ffIconUrl: z
    .string()
    .max(1000, 'URL too long')
    .refine((val) => !val || (val.startsWith('https://') && /^https:\/\/[^\s]+$/.test(val)), {
      message: 'Must be a valid HTTPS URL',
    })
    .optional()
    .or(z.literal('')),
  arenaLogoUrl: z
    .string()
    .max(1000, 'URL too long')
    .refine((val) => !val || (val.startsWith('https://') && /^https:\/\/[^\s]+$/.test(val)), {
      message: 'Must be a valid HTTPS URL',
    })
    .optional()
    .or(z.literal('')),
});

export type AppearanceInput = z.infer<typeof AppearanceSchema>;

export const AdminApplicationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60, 'Name too long').trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  reason: z.string().min(10, 'Please provide at least 10 characters explaining your experience').max(600).trim(),
  contact: z.string().min(3, 'Please provide a valid Discord tag or phone number').max(100).trim(),
});

export type AdminApplicationInput = z.infer<typeof AdminApplicationSchema>;

export const ContactMessageSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60).trim(),
  email: z.string().email('Please enter a valid email address').trim(),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(120).trim(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message cannot exceed 2000 characters').trim(),
});

export type ContactMessageInput = z.infer<typeof ContactMessageSchema>;

export const TournamentSchema = z.object({
  name: z.string().min(3, 'Tournament name must be at least 3 characters').max(60).trim(),
  gameId: z.enum(['BGMI', 'FF_BR', 'FF_CS']),
  status: z.enum(['draft', 'upcoming', 'live', 'completed']),
  registrationOpen: z.boolean(),
  rosterSize: z.number().int().min(1).max(10),
  entryFeePaise: z.number().int().min(0).optional(),
  upiQrUrl: z.string().url('Invalid UPI QR URL').optional().or(z.literal('')),
  upiId: z.string().max(100).optional().or(z.literal('')),
});


export const MatchFormSchema = z.object({
  matchNumber: z.number().int().min(1, 'Match number must be positive integer'),
  scheduledAt: z.string().min(1, 'Schedule date/time is required'),
  map: z.string().min(1, 'Map is required').trim(),
  status: z.enum(['scheduled', 'live', 'completed']),
});

export const PlayerStatSchema = z.object({
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  kills: z.number().int().min(0),
  damage: z.number().min(0),
  assists: z.number().int().min(0),
  survivalSeconds: z.number().min(0),
  revives: z.number().int().min(0),
});

export const TeamResultSchema = z.object({
  teamId: z.string().min(1),
  teamName: z.string().min(1),
  placement: z.number().int().min(1),
  kills: z.number().int().min(0),
  roundsWon: z.number().int().min(0).optional(),
  roundsLost: z.number().int().min(0).optional(),
  playerStats: z.array(PlayerStatSchema),
});

export function validateMatchResults(results: z.infer<typeof TeamResultSchema>[]): { valid: boolean; error?: string } {
  if (!results || results.length === 0) {
    return { valid: true };
  }

  // 1. Placements must be unique integers >= 1
  const placements = results.map((r) => r.placement);
  const uniquePlacements = new Set(placements);
  if (uniquePlacements.size !== placements.length) {
    return { valid: false, error: 'Every team must have a unique placement number.' };
  }

  // 2. Team kills must equal sum of player kills (when player stats are provided)
  for (const team of results) {
    if (team.playerStats && team.playerStats.length > 0) {
      const sumKills = team.playerStats.reduce((sum, p) => sum + (p.kills ?? 0), 0);
      if (sumKills !== team.kills) {
        return {
          valid: false,
          error: `Team "${team.teamName}" total kills (${team.kills}) does not equal sum of player kills (${sumKills}).`,
        };
      }
    }
  }

  return { valid: true };
}
