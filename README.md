# GS Arena 🏆

Production-grade esports tournament operations platform built with **React 18**, **TypeScript (Strict)**, **Tailwind CSS 3.4**, **Framer Motion**, and **Firebase** (Authentication, Firestore, Cloud Storage, Cloud Functions v2). Featuring a custom raw WebGL Twist Ribbon background, glassmorphism design system, independent custom claim RBAC (`admin`, `creator`), deterministic tournament scoring engines, sanitized public analytics feeds, tournament registration with OTR & UPI payment verification, and Excel export.

---

## 1. Quick Start & Prerequisites

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0+
- **Firebase CLI**: `npm install -g firebase-tools`
- **Firebase Project**: A Firebase project with Authentication (Email/Password, Anonymous), Firestore, Cloud Storage, and Cloud Functions enabled. Note: Cloud Functions requires the Firebase **Blaze (pay-as-you-go)** billing plan.

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd "tournament tracker"

# Install frontend dependencies
npm install

# Install Cloud Functions dependencies
cd functions && npm install && cd ..
```

---

## 2. Environment Variables & Configuration

Frontend configuration is loaded strictly through `VITE_*` environment variables. Secrets are **never** bundled into the client build.

Create a `.env` file in the project root:
```env
# Firebase Web App Config (From Firebase Console -> Project Settings -> General)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Local Emulators (Set to 'true' during local emulator testing)
VITE_USE_FIREBASE_EMULATORS=false
```

If these environment variables are missing or unconfigured, the application displays a clear setup screen instead of crashing or showing a blank page.

---

## 3. Security Model & RBAC

Authorization in GS Arena is strictly multi-tiered:
- **Client layer**: React guards and conditional UI provide UX convenience only. They are never trusted for authorization.
- **Database & Storage layers (`firestore.rules`, `storage.rules`)**: Role-based access control enforced via Firebase **custom claims** (`admin: true`, `creator: true`).
- **Backend layer (Cloud Functions)**: Every callable function validates caller authentication, role claims, and input schemas using **Zod**.

### Roles
1. **Public**: Unauthenticated visitors or anonymous submitters. Can view leaderboards, public analytics (`publicAnalytics/{tid}` without PII), game rules, FAQs, and submit squad applications. Cannot view room secrets, leader emails, or payment screenshot proofs.
2. **Admin**: Referees and tournament managers. Can create and schedule matches, input placements and player statistics, review team registrations and payments separately, and export tournament rosters to Excel. Admins **cannot** alter platform system configurations or approve new administrators.
3. **Creator**: Superadministrator. Can approve/reject admin applicants, configure game title appearance icons and brand logos, modify broadcast settings, toggle registrations, generate demo data, and tune global WebGL background uniforms.

---

## 4. Admin Seeding & Creator Access

### 4.1 Idempotent Admin Seed Script (`scripts/seedAdmin.ts`)
To provision the bootstrap administrator account (`dheerajsinghbaghel1306@gmail.com`) using the Firebase Admin SDK:
```bash
# Set INITIAL_ADMIN_PASSWORD in environment (dev only; never commit secrets)
$env:INITIAL_ADMIN_PASSWORD="your-strong-admin-password"

# Run the idempotent seed script
npx ts-node scripts/seedAdmin.ts

# Optional: To update an existing user's password
npx ts-node scripts/seedAdmin.ts --reset-password
```

### 4.2 Creator Access Code (`130620`)
The initial creator access code is `130620`. It is never stored in client code, Firestore documents, or localStorage. It is verified securely on the server via the `claimCreator` Cloud Function using **constant-time string comparison** (`crypto.timingSafeEqual`) and **rate-limited** (5 failed attempts trigger a 15-minute lockout).

To set or rotate the secret in your live Firebase project:
```bash
firebase functions:secrets:set CREATOR_ACCESS_CODE
# When prompted, enter: 130620 (or your rotated secret)
```

### 4.3 SMTP Email Credentials (Room Dispatch & Approvals)
To enable private email delivery of Room IDs and Passwords to approved Team Leaders:
```bash
firebase functions:secrets:set SMTP_HOST
firebase functions:secrets:set SMTP_PORT
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set MAIL_FROM
```
> [!NOTE]
> If SMTP credentials are not configured, the room credentials modal clearly shows **"Email provider not configured"** and will **never** falsely report that emails were sent.

---

## 5. Scoring System & Pure Calculations

### Battle Royale (BGMI & Free Fire BR)
$$\text{teamMatchPoints} = \text{placementPoints}[\text{placement}] + (\text{teamKills} \times \text{killPoints})$$

- **BGMI (BGIS Standard)**: 1st: 10 pts, 2nd: 6, 3rd: 5, 4th: 4, 5th: 3, 6th: 2, 7th: 1, 8th: 1, 9th+: 0 pts. Kill points = 1.
  - *Worked check*: 1st place with 9 team kills = $10 + (9 \times 1) = 19\text{ points}$.
- **Free Fire - BR**: 1st: 12 pts, 2nd: 9, 3rd: 8, 4th: 7, 5th: 6, 6th: 5, 7th: 4, 8th: 3, 9th: 2, 10th: 1, 11th+: 0 pts. Kill points = 1.

**BR Tie-Breaker Protocol**:
1. Total Points
2. Total Placement Points
3. Total Kills
4. Number of 1st-place finishes (WWCD / Booyah)
5. Best placement in latest completed match
6. Alphabetical team name order (deterministic)

### Free Fire - Clash Squad (FF_CS)
Ranked by:
1. Match Wins ($\times 1\text{ pt}$)
2. Round Difference ($\text{Rounds Won} - \text{Rounds Lost}$)
3. Total Rounds Won
4. Alphabetical order

### MVP Impact Score
$$\text{Impact} = (\text{kills} \times 2.5) + \frac{\text{damage}}{100} + (\text{assists} \times 1.0) + \left(\frac{\text{survivalSeconds}}{60} \times 0.2\right) + (\text{revives} \times 1.5)$$

- *Worked check*: 5 kills, 800 damage, 2 assists, 1500s survival, 1 revive:
  $$12.5 + 8.0 + 2.0 + 5.0 + 1.5 = 29.0\text{ points}$$

---

## 6. Registration, Payments & Excel Export

1. **Tournament Entry Fees & UPI QR Codes**: Configured per-tournament in the Admin Console. Displayed to users before uploading payment proof.
2. **Order / Transaction Reference (OTR)**: 6-40 alphanumeric characters trimmed and uppercase-validated. Uniqueness per tournament is transactionally guaranteed via `tournaments/{tid}/otrClaims/{otr}` docs.
3. **Payment Proofs**: Uploaded directly to Cloud Storage with progress tracking. Stored under private path `tournaments/{tid}/payments/` readable only by the uploader and administrators.
4. **Independent Approvals**: Squad eligibility (`approvalStatus`) and payment verification (`paymentStatus`) are tracked and audited independently.
5. **Excel Export**: Admins can export registrations to real `.xlsx` workbooks containing separate **Teams** and **Players** sheets, with OTRs stored as text cells and sensitive PII (phones, screenshot URLs) excluded.

---

## 7. Deployment & Verification

### Local Development
```bash
# Run frontend dev server
npm run dev

# Run Firebase Emulators
firebase emulators:start
```

### Verification Commands
```bash
# Verify static analysis, types, and unit tests
npm run lint
npm run typecheck
npm run test

# Build frontend bundle
npm run build

# Build Cloud Functions
cd functions && npm run build && cd ..
```
