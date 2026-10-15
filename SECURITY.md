<!-- 
  Security policy, threat model, and verification checklist for Tournament Tracker Pro.
  Defines disclosure channels, active defenses, and post-deployment audit guidelines.
-->

# Security Policy

## Reporting a Vulnerability

If you find a security issue, email **gsarena704@gmail.com**. Do not open a public GitHub issue.

## Security Measures

- **HTTPS Enforced**: Enforced via Strict-Transport-Security (HSTS) with preloading.
- **Content Security Policy**: Restricts executable scripts, styles, frames, and connect endpoints.
- **Referrer Policy**: Enforces `strict-origin-when-cross-origin` to prevent URL leakage.
- **MIME Sniffing Prevention**: Enforces `X-Content-Type-Options: nosniff`.
- **Frame Embedding Defense**: Protected via `X-Frame-Options: SAMEORIGIN` and CSP frame-ancestors.
- **Firebase Authentication**: Session persistence configured for browser sessions with verified administrator credential checks.
- **Firestore Security Rules**: Role-based access control prohibiting unauthenticated writes.

## Known Limitations

- Firebase Auth cookies managed by Google may not have HttpOnly flags in all responses — this is expected behavior for client SDK authentication.
- Google Analytics cookies (GAESA) may not have Secure flags on all responses — this is Google-controlled and does not impact application authentication tokens.

## Supported Versions

Only the latest deployed version is supported.

---

## Post-Deploy Checklist

After deploying to production (Vercel, Netlify, or custom domain), verify with:

1. **SecurityHeaders.com**:  
   URL: `https://securityheaders.com/?q=your-url`  
   Expected score: **A or A+**

2. **Qualys SSL Labs**:  
   URL: `https://www.ssllabs.com/ssltest/`  
   Expected grade: **A or A+**

3. **Mozilla Observatory**:  
   URL: `https://observatory.mozilla.org/analyze/your-url`  
   Expected score: **B+ or higher**
