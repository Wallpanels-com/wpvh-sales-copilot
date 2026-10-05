# WallPanels / Verona Home Sales Copilot

A sales workspace above HighLevel. It shows a salesperson's assigned opportunities, what needs attention, conversation and call context, tasks, relationship memory, and a reviewable next action. HighLevel remains the CRM source of truth.

## Architecture

Browser → Railway application → Supabase Auth → authenticated Fastify API → HighLevel / OpenRouter → Supabase cache, preferences, lessons, and audit records. The Node process serves the React build and API on one origin. The browser receives only the Supabase publishable key; service credentials stay on the server.

## Local checks

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Set environment variables from `.env.example` through a secure local secret store or Railway. Run `pnpm dev:api` and `pnpm dev` in separate terminals for development. The Vite proxy sends `/api` to port 3000. The production server uses `pnpm start` after `pnpm build`.

## Safe activation

`DATA_MODE=mock` serves demo records. `DATA_MODE=live` serves the server cache. `CRM_READ_ENABLED=false` prevents the HighLevel read sync and read API calls. `CRM_WRITE_ENABLED=false` rejects every HighLevel mutation. `SAFE_TEST_MODE=true` additionally requires both the contact ID and opportunity ID in the write allowlists. `AI_ENABLED=false` prevents OpenRouter requests. These checks run on the server.

1. Deploy with `DATA_MODE=mock`, `CRM_READ_ENABLED=false`, `CRM_WRITE_ENABLED=false`, `SAFE_TEST_MODE=true`, and `AI_ENABLED=false`.
2. Dmitry manually verifies the UI and Supabase login.
3. After provisioning current HighLevel Private Integration tokens, Supabase service role access, and salesperson mappings, Dmitry manually sets `DATA_MODE=live` and `CRM_READ_ENABLED=true`.
4. Dmitry checks real assigned opportunities, conversations, calls, tasks, and attention states. The developer does not perform a live CRM test.
5. Dmitry puts exact test contact and opportunity IDs in `WRITE_ALLOWLIST_CONTACT_IDS` and `WRITE_ALLOWLIST_OPPORTUNITY_IDS`.
6. Only Dmitry sets `CRM_WRITE_ENABLED=true` while keeping `SAFE_TEST_MODE=true`.
7. Dmitry manually performs the first write test and verifies the result in HighLevel. No AI draft is ever sent automatically.

The Supabase migrations are in `supabase/migrations`. Use a Supabase Auth user with an explicit `copilot_profiles` record and per-location `copilot_user_ghl_mappings` before login. Roles are `sales` and `admin`; the MVP has only a Sales interface. See `docs/DEPLOYMENT.md` and `docs/INTEGRATION_STATUS.md` for configuration and current limitations.
