import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { MAX_FILE_SIZE_BYTES, ALLOWED_IMAGE_TYPES, validateImageFile } from '../services/storageService';

/**
 * Static & Policy verification of firestore.rules and Supabase storage constraints
 * Invariant 1: Public read is permitted across all documents for live cross-device sync
 * Invariant 2: Hardcoded creator email is dheerajsinghbaghel1306@gmail.com
 * Invariant 3: Public can create registrations without auth requirements
 * Invariant 4: Tournaments, matches, and config writes are restricted to Creator/Admin
 * Invariant 5: Storage restricts file size to 5MB and accepts only valid image types
 */
describe('Firestore Security Rules Policy Verification', () => {
  const rulesPath = path.resolve(__dirname, '../../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('enforces public read access at root level for cross-device synchronization', () => {
    expect(rulesContent).toMatch(/match \/\{document=\*\*\} \{\s*allow read: if true;\s*\}/);
  });

  it('hardcodes the creator email for bootstrap authority', () => {
    expect(rulesContent).toContain("request.auth.token.email == 'dheerajsinghbaghel1306@gmail.com'");
  });

  it('allows public squad registrations without requiring auth', () => {
    expect(rulesContent).toMatch(/match \/registrations\/\{rid\} \{\s*allow create: if true;/);
  });

  it('restricts registration modifications and deletions to isAdmin()', () => {
    expect(rulesContent).toMatch(/allow update, delete: if isAdmin\(\);/);
  });

  it('restricts config and game writes to isCreator() or isAdmin()', () => {
    expect(rulesContent).toMatch(/match \/config\/\{doc\} \{\s*allow write: if isCreator\(\) \|\| isAdmin\(\);/);
    expect(rulesContent).toMatch(/match \/games\/\{gameId\} \{\s*allow write: if isCreator\(\) \|\| isAdmin\(\);/);
  });

  it('restricts tournaments and matches write to isAdmin()', () => {
    expect(rulesContent).toMatch(/match \/tournaments\/\{tid\} \{\s*allow write: if isAdmin\(\);/);
    expect(rulesContent).toMatch(/match \/matches\/\{mid\} \{\s*allow write: if isAdmin\(\);/);
  });

  it('allows public to create OTR claims for unique registration checking', () => {
    expect(rulesContent).toMatch(/match \/otrClaims\/\{otr\} \{\s*allow create: if true;/);
  });

  it('protects private match secrets writes with isAdmin()', () => {
    expect(rulesContent).toMatch(/match \/matchSecrets\/\{mid\} \{\s*allow write: if isAdmin\(\);/);
  });

  it('allows users to submit admin requests while reserving approvals for isCreator()', () => {
    expect(rulesContent).toMatch(/match \/adminRequests\/\{uid\} \{/);
    expect(rulesContent).toMatch(/allow update, delete: if isCreator\(\);/);
  });
});

describe('Supabase Storage Policy & Validation Verification', () => {
  it('enforces 5MB max file size limit', () => {
    expect(MAX_FILE_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it('restricts allowed types to JPEG, PNG, and WebP', () => {
    expect(ALLOWED_IMAGE_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp']);
  });

  it('validates images correctly', () => {
    const validFile = new File(['dummy content'], 'proof.png', { type: 'image/png' });
    expect(validateImageFile(validFile).valid).toBe(true);

    const invalidFile = new File(['script'], 'malicious.exe', { type: 'application/x-msdownload' });
    expect(validateImageFile(invalidFile).valid).toBe(false);
  });
});
