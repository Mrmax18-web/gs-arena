# GS ARENA — TOURNAMENT TRACKER PRO · AAA ESPORTS UI OVERHAUL
## ARCHITECTURE & IMPLEMENTATION SUMMARY (MASTER BRIEF v2)

---

### 1. Architectural Decisions & System Design

1. **Design Direction — "Broadcast Noir":**
   - Merged **REFERENCE-A** (pure-black 76px desktop rail with breakout pill, concave fillets / inverse radius, hairline tabs, and icon-only navigation) with **REFERENCE-B** (monochrome display typography, SVG film grain overlay, 3-card tier layout with lifted hero card, check/cross feature lists, corner micro-captions, and hairline borders).
   - Augmented with a broadcast-scoreboard layer: tabular numerals, rank deltas (`▲▼`), live pulse indicators, diagonal cut corners (`12px` clip-path) on hero cards and CTAs, thin neon edge-lights, and sponsor-ready negative space.

2. **Locked Provider Order:**
   - Strictly preserved the locked provider hierarchy in [`src/App.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/App.tsx):
     ```
     BrowserRouter > ToastProvider > TournamentProvider > AuthProvider > [ThemeProvider > BackgroundProvider] > Routes
     ```
   - [`src/components/layout/Layout.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/layout/Layout.tsx) contains strictly `Sidebar`, `Header`, `Footer`, `Outlet` only, with zero providers and zero background elements.

3. **Background & Ribbon Architecture:**
   - WebGL shader code in [`src/components/backgrounds/TwistRibbon.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/backgrounds/TwistRibbon.tsx) is completely frozen and untouched.
   - Connected via [`src/context/BackgroundContext.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/context/BackgroundContext.tsx) to manage ribbon opacity, hue, speed, twist, and wireframe state based on route, active game, and theme.
   - Mounted globally at `z-index: 0` via [`src/components/backgrounds/GlobalRibbon.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/backgrounds/GlobalRibbon.tsx) with [`src/components/ui/GrainOverlay.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/GrainOverlay.tsx) at `z-index: 1`.

4. **3D OrbitCore Icon:**
   - Implemented [`src/components/ui/OrbitCoreIcon.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/OrbitCoreIcon.tsx) (32px header brandmark and 160px hero podium center).
   - Built with `@react-three/fiber` and `@react-three/drei` rendering a metallic PBR torus with pointer repulsion, hover boost, state machine (idle, hover, spin, burst), and a CSS-only gyroscope fallback.

5. **Confetti & Celebration Removal:**
   - Completely deleted `src/components/ui/Confetti.tsx`.
   - Stripped all imports, call sites, and string matches for `Confetti | confetti | celebrate | celebration` and `"use client"` across the codebase (verified 0 matches via `git grep`).

---

### 2. Token Mapping Table

| Semantic Token | Dark Mode | Light Mode | Description |
|---|---|---|---|
| `bg-background` | `#03040A` | `#F7F8FA` | Base viewport canvas background |
| `bg-surface` | `#0A0A0A` | `#FFFFFF` | Primary card and drawer surface |
| `bg-surface-2` | `#101114` | `#F0F1F4` | Elevated controls, inputs, headers |
| `text-foreground` | `#F5F5F5` | `#0A0A0A` | Primary typography |
| `text-muted` | `#9CA3AF` | `#6B7280` | Secondary descriptions and captions |
| `border-border` | `rgba(255,255,255,0.08)` | `rgba(0,0,0,0.08)` | Hairline dividers and boundaries |
| `accent` | `#FF6B35` (BGMI) / `#FF2D2D` (FF) | `#E8541F` / `#E02424` | Primary brand accent driven by `--accent` CSS variable |
| `accent-cyan` | `#00D9FF` | `#0099BF` | Secondary tactical telemetry accent |
| `status-live` | `#FF3B4E` | `#DC2626` | Live broadcast status indicator |

---

### 3. Component Inventory

1. [`src/components/layout/Sidebar.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/layout/Sidebar.tsx): 76px desktop rail with active breakout pill extending 12px beyond the rail with top and bottom concave fillets (`layoutId="sidebarActive"`), 12-spoke starburst logo, pulsing creator lightbulb, role-based item filtering, and 56px mobile bar with swipeable bottom drawer.
2. [`src/components/layout/Header.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/layout/Header.tsx): Fixed top navigation bar containing the 32px 3D OrbitCoreIcon, game switcher pill, live broadcast indicator, and theme selector dropdown.
3. [`src/components/ui/MorphTabs.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/MorphTabs.tsx): Underline (hairline tabs from REFERENCE-A) and segmented variants with spring layout animation.
4. [`src/components/ui/CutCard.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/CutCard.tsx): Diagonal cut-corner container with hairline neon borders, top highlight, and hover lift.
5. [`src/components/ui/TagChip.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/TagChip.tsx): Micro uppercase badge (4px radius, tracking-widest, monospace).
6. [`src/components/ui/StatCard.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/StatCard.tsx): High-density scoreboard numeral widget with rank delta and corner micro-captions.
7. [`src/components/ui/FeatureList.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/FeatureList.tsx): Monochrome check/cross list from REFERENCE-B.
8. [`src/components/ui/GlassIconButton.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/GlassIconButton.tsx): Circular frosted glass button with glow on hover.
9. [`src/components/ui/CornerCaption.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/CornerCaption.tsx): Pinned corner telemetry label.
10. [`src/components/ui/OrbitCoreIcon.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/components/ui/OrbitCoreIcon.tsx): 3D Three.js PBR metallic ring with pointer deflection.

---

### 4. Gate Verification Log

- [x] **GATE 1 (Anti-Flash & Tokens):** Verified `<script>` in `index.html` prevents light/dark flash before React hydration. JetBrains Mono, Space Mono, and Inter loaded via Google Fonts preconnect.
- [x] **GATE 2 (Provider Hierarchy & App.tsx):** Verified provider order is strictly:
  `BrowserRouter > ToastProvider > TournamentProvider > AuthProvider > ThemeProvider > BackgroundProvider > Routes`.
- [x] **GATE 3 (Sidebar & Navigation):** Verified 76px rail, breakout pill with concave fillets (`layoutId`), mobile drawer fallback, and route active matchers.
- [x] **GATE 4 (Confetti Cleanliness):** Verified `git grep -i -E "confetti|celebrat|use client" src` returns 0 occurrences.
- [x] **GATE 5 (TypeScript & Production Build):** Run `npm run build` (`npx vite build`):
  - 2,228 modules transformed cleanly.
  - Zero TypeScript compile errors.
  - Built bundle produced in `dist/`.
- [x] **GATE 6 (Git History):** Staged and committed in 6 distinct atomic commits as mandated by Master Brief v2.

---

### 5. Icon Substitutions

- Pre-registered all required icons into [`src/lib/icons.tsx`](file:///C:/Users/Dheer/antigravity/Tournament-Tracker-Pro/src/lib/icons.tsx) and Lucide icon mappings.
- For `solar:swords-bold-duotone` (not in core solar bundle): substituted with Lucide `Swords` / `Flame` / `Trophy` which match the Broadcast Noir visual weight.
- Starburst logo implemented with standard 12-spoke geometry SVG and 3D OrbitCore.
