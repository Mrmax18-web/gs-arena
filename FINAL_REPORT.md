# GS Arena — Mobile Login UI Touches, Z-Index Overlays & Firestore Transport Report

**Branch:** `fix/mobile-login-firestore-transport`  
**Commit:** `0eed680` (`fix: mobile login UI touches, z-index overlays, and firestore transport error`)  
**Deployment Target:** [https://gs-arena.vercel.app/](https://gs-arena.vercel.app/)  
**Environment:** React 18, TypeScript 5.5, Vite 5.4, Tailwind CSS 3.4, Firebase 10.13, Supabase Storage  

---

## 1. Executive Summary

This investigation and remediation addressed two critical classes of defects on GS Arena's mobile experience:
1. **Unclickable/Unresponsive Mobile Login UI**: On mobile viewports (notably `411x568` and ultra-narrow `283x568`), users experienced unresponsive email and password inputs, off-screen submit buttons when the soft keyboard was open, and horizontal reflow clipping.
2. **Firestore WebChannel Transport Errors**: Console errors reporting `WebChannelConnection RPC 'Listen' stream ... transport errored` were occurring upon loading or navigating due to HTTP/2 streaming proxy truncation and unauthenticated attempts to listen to creator-only collections (`adminRequests`).

Both issues have been remediated at the root cause, tested across multiple mobile viewports, verified with 81 unit/integration tests, and confirmed with Playwright end-to-end device emulation.

---

## 2. Root Cause Analysis & Evidence

### Bug A: Canvas Overlay & Stacking Context
- **Root Cause**: In [`TwistRibbon.tsx`](src/components/backgrounds/TwistRibbon.tsx), the rendered `<canvas>` element lacked explicit inline and CSS `pointer-events: none`. In mobile Blink and WebKit browsers, active hardware-accelerated WebGL canvases can capture touch events or hit-test intercepts even when sibling containers appear visually on top if stacking contexts are ambiguous.
- **Fix**:
  - Explicitly added `pointerEvents: 'none'` and Tailwind `pointer-events-none` directly onto the `<canvas>` tag and its bounding wrapper in [`TwistRibbon.tsx`](src/components/backgrounds/TwistRibbon.tsx).
  - Enforced `relative z-10` on the main application outlet in [`AppLayout.tsx`](src/components/layout/AppLayout.tsx) to ensure content layers consistently establish an isolated stacking context above the background layer (`z-0` / `z-[-1]`).

### Bug B: Form Layout, Narrow Reflow (283px), and Touch Targets (WCAG 2.2 AA)
- **Root Cause**:
  - In [`LoginPage.tsx`](src/pages/LoginPage.tsx), the inputs lacked explicit `id`, `name`, and standard mobile autofill `autoComplete` attributes (`email`, `current-password`, `new-password`), degrading mobile OS password-manager integration and virtual keyboard focus hints.
  - The page used `min-h-[80vh]` rather than `min-h-[100dvh]` with `overflow-y-auto`, preventing users from scrolling down to the submit button when the on-screen virtual keyboard reduced the viewport to 320px.
  - On ultra-narrow screens (`283x568` Galaxy Fold cover screen), static padding (`p-8`, 64px total horizontal padding) left only 219px of horizontal space, causing form elements to compress and clip.
- **Fix**:
  - Form wrapper upgraded to `w-full min-h-[100vh] min-h-[100dvh] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto`.
  - Card container upgraded to `w-full max-w-md mx-auto p-4 sm:p-6 md:p-8 shadow-2xl text-left border-slate-200 dark:border-white/10`.
  - Added explicit `id`, `name`, `type`, and standard `autoComplete` attributes to all form fields.
  - Submit buttons and standard interactive elements guaranteed to meet WCAG 2.2 AA minimum touch target sizing of 44x44px (`min-h-[44px]` in [`Button.tsx`](src/components/ui/Button.tsx)).

### Bug C: Firestore WebChannel Transport Crash & Listener Gating
- **Root Cause**:
  1. Default Firestore initialization via `getFirestore(app)` attempts HTTP/2 persistent streaming for its `Listen` RPC. In restrictive network environments, mobile carrier proxies, or ad-blocking DNS, HTTP/2 long-lived streaming connections are prematurely dropped, triggering `WebChannelConnection RPC 'Listen' stream ... transport errored`.
  2. In [`CreatorPage.tsx`](src/pages/CreatorPage.tsx), `useFirestoreCollection('adminRequests')` was subscribed unconditionally at the top of the component. Under `firestore.rules`, `adminRequests` requires `isCreator()`. Unauthenticated users or non-creator users mounting or navigating to `/creator` immediately triggered a Firestore `permission-denied` event on the Listen stream, crashing the WebChannel transport.
- **Fix**:
  - In [`src/lib/firebase.ts`](src/lib/firebase.ts), initialized Firestore with `initializeFirestore(app, { experimentalAutoDetectLongPolling: true })` with graceful fallback to `getFirestore(app)`.
  - In [`useFirestoreCollection.ts`](src/hooks/useFirestoreCollection.ts), introduced an `options?: { enabled?: boolean }` parameter. When `enabled === false`, `onSnapshot` is skipped, returning `data: []` and `loading: false`.
  - In [`CreatorPage.tsx`](src/pages/CreatorPage.tsx), gated `adminRequests` behind `enabled: Boolean(user && isCreator(role))`.
  - In [`AdminPage.tsx`](src/pages/AdminPage.tsx), gated `registrations` behind `enabled: Boolean(user && isAdmin(role))`.

---

## 3. Audit of Active Firestore Listeners

GS Arena maintains a set of real-time listeners across the application. The audit verified that public listeners remain open while protected listeners are safely gated:

| Listener Path | Type | Access Level | Error Callback Present? | Gated Behind Role? | Status |
| :--- | :--- | :--- | :---: | :---: | :--- |
| `config/background` | Document | Public (`read: true`) | Yes | No (needed for site background) | OK |
| `config/appearance` | Document | Public (`read: true`) | Yes | No (needed for logo/theme) | OK |
| `config/system` | Document | Public (`read: true`) | Yes | No (needed for system status) | OK |
| `tournaments` | Collection | Public (`read: true`) | Yes | No (needed for public brackets) | OK |
| `tournaments/{tid}/matches` | Subcollection | Public (`read: true`) | Yes | No (needed for live scorekeeper) | OK |
| `tournaments/{tid}/teams` | Subcollection | Public (`read: true`) | Yes | No (needed for standings) | OK |
| `adminRequests` | Collection | Creator Only | Yes | **Yes** (`user && isCreator(role)`) | **Gated** |
| `registrations` | Collection | Admin/Creator Only | Yes | **Yes** (`user && isAdmin(role)`) | **Gated** |

---

## 4. Verification & Quality Gates

### 1. Unit & Component Tests (`vitest run`)
- **Suite**: [`src/test/mobileLogin.test.tsx`](src/test/mobileLogin.test.tsx) + 9 existing test suites.
- **Results**: **10 test files passed (100%), 81 tests passed, 0 failures**.
- Tested scenarios:
  - Single `<form>` wrapping inputs and submit button.
  - Linked labels and inputs via `id` and `htmlFor`.
  - Form attributes (`type`, `name`, `autoComplete`).
  - Submit button minimum 44px touch height (`min-h-[44px]`).
  - Tab switching between Sign In, Register, and Apply.
  - `useFirestoreCollection` listener gating (`enabled: false` prevents `onSnapshot`, `enabled: true` subscribes and unmounts cleanly).

### 2. Mobile Viewport E2E Verification ([`scripts/verify-mobile-login-fixes.cjs`](scripts/verify-mobile-login-fixes.cjs))
Executed Playwright against a production build across 4 mobile viewports:
- **`411x568`** (Android small):
  - Canvas pointer-events: `none`
  - Email input clickable & typed: `"test@example.com"`
  - Password input clickable & typed: `"SecretPass123!"`
  - Submit button dimensions: `337x44px` (`>= 44px: true`)
  - Horizontal overflow: `scrollWidth=411px`, `clientWidth=411px` (`hasHorizontalOverflow: false`)
  - Virtual keyboard scrollability: submit button in view = `true` (`top: 166px` in `320px` height)
- **`283x568`** (Narrow Fold cover screen):
  - Canvas pointer-events: `none`
  - Email input clickable & typed: `"test@example.com"`
  - Password input clickable & typed: `"SecretPass123!"`
  - Submit button dimensions: `209x44px` (`>= 44px: true`)
  - Horizontal overflow: `scrollWidth=283px`, `clientWidth=283px` (`hasHorizontalOverflow: false`)
  - Virtual keyboard scrollability: submit button in view = `true` (`top: 166px` in `320px` height)
- **`375x667`** (iPhone SE): All checks passed (`301x44px` submit button, 0 horizontal overflow).
- **`390x844`** (iPhone 13/14): All checks passed (`316x44px` submit button, 0 horizontal overflow).

### 3. Static Analysis & Build
- `npm run typecheck` (`tsc --noEmit`): **0 errors**
- `npm run lint` (`eslint .`): **0 errors, 0 warnings**
- `npm run build` (`vite build`): **Production bundle compiled cleanly in 5.95s**
