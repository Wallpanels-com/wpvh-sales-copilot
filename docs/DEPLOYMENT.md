# Deployment and provisioning

Railway runs `corepack enable && pnpm install --frozen-lockfile && pnpm build`, then `pnpm start`. The health check is `/api/health`; it does not contact Supabase, HighLevel, or OpenRouter. Nested SPA routes fall back to `index.html`.

Use Railway service variables for all names in `.env.example`. Never commit `.env`, the desktop credential document, service role key, HighLevel tokens, or OpenRouter key. `SUPABASE_ANON_KEY` is the Supabase publishable key and is intentionally supplied to the browser; all other credential values remain on the server. The deployed default is mock, read off, write off, safe test on, AI off.

Provision a Supabase Auth user through Supabase's normal authentication flow, then insert a matching `copilot_profiles` row with role `sales` or `admin`. Add one `copilot_user_ghl_mappings` row per assigned location using the corresponding HighLevel user ID. The API rejects unprovisioned users. For live mode, set `SUPABASE_SERVICE_ROLE_KEY` in Railway and current HighLevel Private Integration tokens with read scopes. Legacy API v1 keys are not accepted as a substitute. Restrict integration scopes to the endpoints in `server/highlevel`.

The migration files have been applied to Supabase project `jqzhvnswwvbsqwwhcewn`. They isolate this product from pre-existing tables. If onboarding a second environment, apply all migrations in order before deployment.

Read activation and write testing are deliberately owner-operated. Follow the exact sequence in README. Keep `SAFE_TEST_MODE=true` for the first manual write. Review `copilot_action_audit_log` and the HighLevel record after testing. A failed or uncertain provider response stays marked `failed_or_unknown` and the same idempotency key cannot be retried silently.
