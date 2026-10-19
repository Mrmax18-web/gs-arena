import { describe, it, expect } from 'vitest';
import {
  RegistrationSchema,
  AppearanceSchema,
  OTR_REGEX,
} from '../lib/validators';
import {
  sanitizeInputString,
  containsProfanity,
  containsScriptTag,
} from '../lib/moderation';

describe('Task 5: Content Moderation & Input Validation Test Corpus', () => {
  const baseValidPayload = {
    tournamentId: 'bgmi-masters-2026',
    teamName: 'Team Alpha',
    leaderEmail: 'leader@alpha.gg',
    players: ['Alpha_One', 'Alpha_Two', 'Alpha_Three', 'Alpha_Four'],
    otr: 'OTR-9876543210',
    paymentScreenshotUrl: 'https://example.com/receipt.png',
    rulesAccepted: true as const,
  };

  // 1. Empty string and whitespace-only
  describe('Corpus 1: Empty string and whitespace-only', () => {
    it('blocks empty string and whitespace-only in Team Name', () => {
      const payload = { ...baseValidPayload, teamName: '   ' };
      const res = RegistrationSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/at least 2 characters/i);
      }
    });

    it('blocks empty or whitespace player names', () => {
      const payload = {
        ...baseValidPayload,
        players: ['PlayerOne', '  ', 'PlayerThree', 'PlayerFour'],
      };
      const res = RegistrationSchema.safeParse(payload);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/at least 2 characters/i);
      }
    });

    it('blocks empty or whitespace OTR', () => {
      const payload = { ...baseValidPayload, otr: '    ' };
      const res = RegistrationSchema.safeParse(payload);
      expect(res.success).toBe(false);
    });
  });

  // 2. 1,000 and 10,000 character strings (Buffer overflow / DoS)
  describe('Corpus 2: 1,000 and 10,000 character strings', () => {
    it('blocks 1,000 character string in Team Name', () => {
      const longStr = 'A'.repeat(1000);
      const res = RegistrationSchema.safeParse({ ...baseValidPayload, teamName: longStr });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/cannot exceed 40 characters/i);
      }
    });

    it('blocks 10,000 character string in Player Name', () => {
      const massiveStr = 'X'.repeat(10000);
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        players: ['Alpha_One', massiveStr, 'Alpha_Three', 'Alpha_Four'],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/cannot exceed 30 characters/i);
      }
    });

    it('blocks 1,000 character string in Creator Site Name', () => {
      const longSiteName = 'S'.repeat(1000);
      const res = AppearanceSchema.safeParse({ siteName: longSiteName });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/cannot exceed 50 characters/i);
      }
    });
  });

  // 3. Unicode edge cases: emoji, RTL, zero-width, combining marks
  describe('Corpus 3: Unicode edge cases (emoji, RTL, zero-width, combining marks)', () => {
    it('strips zero-width invisible characters before length validation', () => {
      const zeroWidthName = 'A\u200B\u200C\u200D'; // Only 1 visible character
      const sanitized = sanitizeInputString(zeroWidthName);
      expect(sanitized).toBe('A');

      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: zeroWidthName,
      });
      expect(res.success).toBe(false); // Fails because 1 char < 2 chars
    });

    it('safely handles RTL text without crashing or breaking structure', () => {
      const rtlName = 'فريق القوة';
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: rtlName,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.teamName).toBe(rtlName);
      }
    });

    it('safely accepts valid emoji team names without corruption', () => {
      const emojiName = 'Team 🏆 Fire 🔥';
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: emojiName,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.teamName).toBe(emojiName);
      }
    });
  });

  // 4. HTML/script markup (XSS test payloads)
  describe('Corpus 4: HTML/script markup & XSS payloads', () => {
    it('blocks script tag injection in Team Name', () => {
      const xssPayload = "<script>console.log('xss-test')</script>";
      expect(containsScriptTag(xssPayload)).toBe(true);

      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: xssPayload,
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/script tags or markup/i);
      }
    });

    it('blocks javascript: URI scheme in inputs', () => {
      const jsPayload = "javascript:alert('xss')";
      expect(containsScriptTag(jsPayload)).toBe(true);

      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: jsPayload,
      });
      expect(res.success).toBe(false);
    });

    it('blocks script tags in Creator siteName', () => {
      const res = AppearanceSchema.safeParse({
        siteName: "<script>alert('admin')</script>",
      });
      expect(res.success).toBe(false);
    });
  });

  // 5. Quote / SQL-style characters
  describe('Corpus 5: Quote/SQL-style characters (\' " ; -- and %00)', () => {
    it('strips null byte %00 without crashing', () => {
      const nullByteStr = "Team\x00Name";
      const sanitized = sanitizeInputString(nullByteStr);
      expect(sanitized).toBe('TeamName');
    });

    it('safely handles quotes and SQL-style syntax as benign literal text without injection', () => {
      const sqlPayload = "Team'; DROP TABLE--";
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: sqlPayload,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.teamName).toBe("Team'; DROP TABLE--");
      }
    });
  });

  // 6. Template / format strings (${7*7} and {{7*7}})
  describe('Corpus 6: Template/format strings (${7*7} and {{7*7}})', () => {
    it('treats template syntax as literal inert string and does not evaluate', () => {
      const tplPayload = 'Squad_${7*7}_{{7*7}}';
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: tplPayload,
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.teamName).toBe('Squad_${7*7}_{{7*7}}');
      }
    });
  });

  // 7. Mild profanity & abusive-language test tokens
  describe('Corpus 7: Mild profanity & abusive language', () => {
    it('blocks prohibited test profanity token in team name', () => {
      expect(containsProfanity('Team toxicplayer')).toBe(true);
      expect(containsProfanity('Team testprofanity')).toBe(true);

      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: 'Team toxicplayer',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/prohibited or abusive/i);
      }
    });

    it('blocks leetspeak profanity substitutions (e.g. t0xicplayer or f*ck)', () => {
      expect(containsProfanity('Team t0xicplayer')).toBe(true);
      expect(containsProfanity('Team f*ck')).toBe(true);

      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: 'Team t0xicplayer',
      });
      expect(res.success).toBe(false);
    });

    it('allows benign names that contain ordinary substrings', () => {
      expect(containsProfanity('Classics')).toBe(false);
      expect(containsProfanity('Assistant')).toBe(false);
      expect(containsProfanity('Passage')).toBe(false);
    });
  });

  // 8. Leading/trailing spaces and duplicate submissions
  describe('Corpus 8: Leading/trailing spaces & duplicates', () => {
    it('trims leading and trailing spaces automatically', () => {
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        teamName: '   Clean Team   ',
        players: ['  P1_Alpha  ', '  P2_Beta  ', '  P3_Gamma  ', '  P4_Delta  '],
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.teamName).toBe('Clean Team');
        expect(res.data.players[0]).toBe('P1_Alpha');
      }
    });

    it('rejects duplicate player IDs across roster regardless of casing', () => {
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        players: ['Player_Alpha', 'player_alpha', 'Player_Three', 'Player_Four'],
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.errors[0].message).toMatch(/must be unique/i);
      }
    });
  });

  // 9. OTR Format & Uppercase normalization
  describe('Corpus 9: OTR Format & normalization', () => {
    it('normalizes OTR to uppercase and validates against OTR_REGEX', () => {
      const res = RegistrationSchema.safeParse({
        ...baseValidPayload,
        otr: '  upi-abc123456  ',
      });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.otr).toBe('UPI-ABC123456');
      }
    });

    it('rejects OTR shorter than 6 characters or containing invalid symbols', () => {
      expect(OTR_REGEX.test('12345')).toBe(false);
      expect(OTR_REGEX.test('OTR!@#$%^')).toBe(false);
      expect(OTR_REGEX.test('OTR-1234567890')).toBe(true);
    });
  });
});
