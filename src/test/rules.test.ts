import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Static & Logic verification of firestore.rules and storage.rules security invariants
 * Invariant 1: Public cannot write tournaments or publicAnalytics
 * Invariant 2: Admin cannot write config/system (creator only)
 * Invariant 3: User cannot set their own role or elevate role
 * Invariant 4: Public cannot read registrations, matchSecrets, or otrClaims
 * Invariant 5: Update bypass prevention via onlyChanges / validator
 * Invariant 6: Storage private screenshots, public logos, 5MB limit
 */
describe('Firestore Security Rules Policy Verification', () => {
  const rulesPath = path.resolve(__dirname, '../../firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  it('enforces default deny at root level', () => {
    expect(rulesContent).toContain('match /{document=**} { allow read, write: if false; }');
  });

  it('strictly restricts config collection write to isCreator() (admins explicitly excluded)', () => {
    expect(rulesContent).toMatch(/match \/config\/\{doc\} \{\s*allow read: if true;\s*allow write: if isCreator\(\);/);
  });

  it('restricts tournaments and subcollections write to isAdmin()', () => {
    expect(rulesContent).toMatch(/match \/tournaments\/\{tid\} \{\s*allow read: if true;\s*allow write: if isAdmin\(\);/);
    expect(rulesContent).toMatch(/match \/matches\/\{mid\} \{ allow read: if true; allow write: if isAdmin\(\); \}/);
    expect(rulesContent).toMatch(/match \/teams\/\{teamId\} \{ allow read: if true; allow write: if isAdmin\(\); \}/);
  });

  it('protects transactional OTR claim docs within tournament subcollections', () => {
    expect(rulesContent).toMatch(/match \/otrClaims\/\{otr\} \{/);
    expect(rulesContent).toContain('request.resource.data.otr == otr');
  });

  it('allows public read on sanitized publicAnalytics collection but restricts writes to isAdmin()', () => {
    expect(rulesContent).toMatch(/match \/publicAnalytics\/\{tid\} \{\s*allow read: if true;\s*allow write: if isAdmin\(\);/);
  });

  it('keeps matchSecrets completely private from public reads', () => {
    expect(rulesContent).toMatch(/match \/matchSecrets\/\{mid\} \{\s*allow read, write: if isAdmin\(\);/);
    expect(rulesContent).not.toMatch(/match \/matchSecrets\/\{mid\} \{\s*allow read: if true;/);
  });

  it('restricts registrations read to admin or document owner (public cannot read)', () => {
    expect(rulesContent).toContain(
      'allow read: if isAdmin() || (signedIn() && resource.data.ownerUid == request.auth.uid);'
    );
  });

  it('validates registration creation with OTR and restricts updates to review fields only', () => {
    expect(rulesContent).toContain("request.resource.data.status == 'pending'");
    expect(rulesContent).toContain("request.resource.data.players.size() == 4");
    expect(rulesContent).toContain("request.resource.data.otr.size() >= 6");
    expect(rulesContent).toMatch(/allow update: if isAdmin\(\) && onlyChanges\(\[\s*'status'/);
    expect(rulesContent).toContain('paymentStatus');
    expect(rulesContent).toContain('approvalStatus');
    expect(rulesContent).toContain('allow delete: if isCreator();');
  });

  it('prevents users from elevating their own role upon account creation or update', () => {
    expect(rulesContent).toContain(
      "allow create: if signedIn() && request.auth.uid == uid && request.resource.data.role == 'public';"
    );
    expect(rulesContent).toContain(
      "allow update: if signedIn() && request.auth.uid == uid && onlyChanges(['displayName','updatedAt']);"
    );
  });

  it('disallows client update and delete of adminRequests (Functions only)', () => {
    expect(rulesContent).toMatch(/match \/adminRequests\/\{uid\} \{[\s\S]*allow update, delete: if false;/);
  });
});

describe('Storage Security Rules Policy Verification', () => {
  const storageRulesPath = path.resolve(__dirname, '../../storage.rules');
  const storageRulesContent = fs.readFileSync(storageRulesPath, 'utf8');

  it('restricts file size to 5MB and allows only valid image types', () => {
    expect(storageRulesContent).toContain('5 * 1024 * 1024');
    expect(storageRulesContent).toContain("image/(jpeg|png|webp)");
  });

  it('allows public read on logos but keeps payment screenshots private to owner and admin', () => {
    expect(storageRulesContent).toMatch(/match \/tournaments\/\{tid\}\/logos\/\{filename\} \{\s*allow read: if true;/);
    expect(storageRulesContent).toMatch(/match \/tournaments\/\{tid\}\/payments\/\{filename\} \{/);
    expect(storageRulesContent).toContain("filename.matches('^' + request.auth.uid + '_.*')");
  });

  it('enforces default deny for unmapped storage paths', () => {
    expect(storageRulesContent).toContain('match /{allPaths=**} {\n      allow read, write: if false;\n    }');
  });
});
