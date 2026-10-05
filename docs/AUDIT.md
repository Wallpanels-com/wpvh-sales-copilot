# Prototype audit

| Issue | Severity | Fix |
| --- | --- | --- |
| Monolithic `App.tsx`, mixed mock records and UI state | High | Split routing, auth, API client, pages, dialogs, and backend services. |
| `localStorage` fake login and hardcoded Maria identity | Critical | Supabase password session, backend JWT verification, profile lookup, signed-in name. |
| Manual history changes and broken refresh/back behavior | High | React Router plus server SPA fallback. |
| Wrong lead context in Conversations send flow | Critical | Selected conversation owns its lead and URL; confirmation receives that lead. |
| Lead-to-Call fallback could open another client | High | Only a matching location and opportunity produces a call link. |
| Filters, sort, and pagination decorative | High | Wired query state and server filtering; live data stays behind authenticated API. |
| No-op recording and note controls | High | Recording displayed only when available; note uses an explicit guarded action flow. |
| No backend, CRM, Supabase, or AI integration | Critical | Fastify API, isolated RLS tables, safe HighLevel adapters, OpenRouter routing and cache. |
| Unclear pending vs sent actions | High | Confirmation shows client, channel, exact text, and safe lock state; no optimistic live success. |
| Hardcoded CRM stages | High | Live pipeline/stage names come from HighLevel cache. |
| Dummy logo, external Google Fonts | Medium | Local vector brand mark and bundled Manrope/DM Mono fonts. |
| Very small text, weak responsive layouts | Medium | Increased type scale, aligned cards and grids, mobile layout corrections. |
| Missing loading/error/empty states | Medium | Shared state components and safe error labels. |
| Duplicate action risk and exposed provider errors | High | Server idempotency audit, guarded writes, sanitized API errors and rate limits. |

The original ZIP was a frontend prototype. It had no real CRM writes. Local tests and the deployed default mode must not call HighLevel or OpenRouter.
