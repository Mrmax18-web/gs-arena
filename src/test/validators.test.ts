import { describe, it, expect } from 'vitest';
import {
  RegistrationSchema,
  AppearanceSchema,
  validateMatchResults,
  OTR_REGEX,
} from '../lib/validators';

describe('Validation Schemas and Business Rules', () => {
  describe('RegistrationSchema', () => {
    it('accepts valid registration input with OTR and payment screenshot', () => {
      const valid = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'leader@soulesports.com',
        players: ['PlayerOne', 'PlayerTwo', 'PlayerThree', 'PlayerFour'],
        otr: 'UPI-9876543210-TXN',
        paymentScreenshotUrl: 'https://firebasestorage.googleapis.com/v0/b/app/o/proof.png',
        rulesAccepted: true as const,
      };

      const result = RegistrationSchema.safeParse(valid);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.otr).toBe('UPI-9876543210-TXN');
      }
    });

    it('transforms lowercase OTR to uppercase and validates', () => {
      const input = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'leader@soulesports.com',
        players: ['PlayerOne', 'PlayerTwo', 'PlayerThree', 'PlayerFour'],
        otr: 'upi_txn_12345',
        paymentScreenshotUrl: 'https://storage.googleapis.com/test/screenshot.webp',
        rulesAccepted: true as const,
      };

      const result = RegistrationSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.otr).toBe('UPI_TXN_12345');
      }
    });

    it('rejects OTR shorter than 6 characters or with special disallowed characters', () => {
      expect(OTR_REGEX.test('12345')).toBe(false); // too short (<6)
      expect(OTR_REGEX.test('1234$6')).toBe(false); // disallowed special character $
      expect(OTR_REGEX.test('UPI_TXN_1234567890')).toBe(true); // valid
      expect(OTR_REGEX.test('TXN-ABC-XYZ_012')).toBe(true); // valid
    });

    it('rejects missing or invalid payment screenshot', () => {
      const missingScreenshot = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'leader@soulesports.com',
        players: ['P1', 'P2', 'P3', 'P4'],
        otr: 'UPI-9876543210',
        paymentScreenshotUrl: '',
        rulesAccepted: true as const,
      };

      const result = RegistrationSchema.safeParse(missingScreenshot);
      expect(result.success).toBe(false);
    });

    it('rejects duplicate player IDs in the same team', () => {
      const duplicatePlayers = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'leader@soulesports.com',
        players: ['PlayerOne', 'PlayerTwo', 'PlayerOne', 'PlayerFour'], // Duplicate
        otr: 'UPI-9876543210',
        paymentScreenshotUrl: 'https://test.com/img.png',
        rulesAccepted: true as const,
      };

      const result = RegistrationSchema.safeParse(duplicatePlayers);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('unique');
      }
    });

    it('rejects when players count is not exactly 4', () => {
      const invalidCount = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'leader@soulesports.com',
        players: ['PlayerOne', 'PlayerTwo', 'PlayerThree'], // only 3
        otr: 'UPI-9876543210',
        paymentScreenshotUrl: 'https://test.com/img.png',
        rulesAccepted: true as const,
      };

      const result = RegistrationSchema.safeParse(invalidCount);
      expect(result.success).toBe(false);
    });

    it('rejects invalid email address', () => {
      const invalidEmail = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'not-an-email',
        players: ['P1', 'P2', 'P3', 'P4'],
        otr: 'UPI-9876543210',
        paymentScreenshotUrl: 'https://test.com/img.png',
        rulesAccepted: true as const,
      };

      const result = RegistrationSchema.safeParse(invalidEmail);
      expect(result.success).toBe(false);
    });

    it('rejects unaccepted rules', () => {
      const unaccepted = {
        tournamentId: 'tourney-123',
        teamName: 'Soul Esports',
        leaderEmail: 'leader@soulesports.com',
        players: ['P1', 'P2', 'P3', 'P4'],
        otr: 'UPI-9876543210',
        paymentScreenshotUrl: 'https://test.com/img.png',
        rulesAccepted: false,
      };

      const result = RegistrationSchema.safeParse(unaccepted);
      expect(result.success).toBe(false);
    });
  });

  describe('AppearanceSchema', () => {
    it('accepts valid HTTPS URLs for icons and logo', () => {
      const valid = {
        bgmiIconUrl: 'https://cdn.example.com/bgmi.png',
        ffIconUrl: 'https://cdn.example.com/ff.png',
        arenaLogoUrl: 'https://cdn.example.com/logo.svg',
      };
      const res = AppearanceSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it('rejects insecure HTTP URLs', () => {
      const insecure = {
        bgmiIconUrl: 'http://cdn.example.com/bgmi.png',
      };
      const res = AppearanceSchema.safeParse(insecure);
      expect(res.success).toBe(false);
    });
  });

  describe('validateMatchResults', () => {
    it('validates unique placements correctly', () => {
      const duplicatePlacements = [
        { teamId: 't1', teamName: 'Team 1', placement: 1, kills: 2, playerStats: [{ playerId: 'p1', playerName: 'P1', kills: 2, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 }] },
        { teamId: 't2', teamName: 'Team 2', placement: 1, kills: 0, playerStats: [{ playerId: 'p2', playerName: 'P2', kills: 0, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 }] },
      ];

      const check = validateMatchResults(duplicatePlacements as any);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('unique placement');
    });

    it('validates that team kills equal sum of player kills', () => {
      const mismatchKills = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          placement: 1,
          kills: 5,
          playerStats: [
            { playerId: 'p1', playerName: 'P1', kills: 2, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 },
            { playerId: 'p2', playerName: 'P2', kills: 1, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 },
          ],
        },
      ];

      const check = validateMatchResults(mismatchKills as any);
      expect(check.valid).toBe(false);
      expect(check.error).toContain('does not equal sum of player kills');
    });

    it('passes when placements are unique and kills match player sums', () => {
      const validResults = [
        {
          teamId: 't1',
          teamName: 'Team 1',
          placement: 1,
          kills: 3,
          playerStats: [
            { playerId: 'p1', playerName: 'P1', kills: 2, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 },
            { playerId: 'p2', playerName: 'P2', kills: 1, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 },
          ],
        },
        {
          teamId: 't2',
          teamName: 'Team 2',
          placement: 2,
          kills: 1,
          playerStats: [
            { playerId: 'p3', playerName: 'P3', kills: 1, damage: 100, assists: 0, survivalSeconds: 100, revives: 0 },
          ],
        },
      ];

      const check = validateMatchResults(validResults as any);
      expect(check.valid).toBe(true);
    });
  });
});
