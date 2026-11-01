# GS Arena — Debugging & Optimization Tasks

## 🔴 Critical Bugs (Blocking Access)
- [ ] **Infinite Loop on `/admin`**: Review `RoleGuard.tsx` and `AuthContext.tsx`. The `loading` state likely never resolves or the `useEffect` is re-triggering.
- [ ] **Creator Panel Unresponsive**: Check `CreatorPage.tsx` and ensure the hardcoded admin email check (`dheerajsinghbaghel1306@gmail.com`) isn't failing due to a race condition with Firebase Auth initialization.
- [ ] **Registration Fails**: Ensure no `signInAnonymously()` calls exist in `RegistrationForm.tsx`.

## 🟡 Performance Bottlenecks (Lag & Slow Load)
- [ ] **Severe Interface Lag**: The WebGL `TwistRibbon` or Firestore `onSnapshot` listeners are likely blocking the main thread.
- [ ] **Icon Loading Lag**: Refactor `lucide-react` and `@iconify/react` to use lazy loading or tree-shaking.
- [ ] **Long Loading Times**: Implement `React.lazy` for all page routes and configure Vite chunk splitting.