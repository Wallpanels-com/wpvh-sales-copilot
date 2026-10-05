# Integration status

| Integration | Prepared | Externally tested | Current state |
| --- | --- | --- | --- |
| Supabase Auth and isolated database | Yes | Database migrations only | RLS tables applied. Login requires an Auth user and matching profile. |
| HighLevel read | Yes | No | Disabled. Current desktop HighLevel credentials appear to be legacy API v1 keys, not current Private Integration tokens. No CRM calls were made. |
| HighLevel write | Yes | No | Disabled server-side; safe allowlists blank. No CRM mutation was made. |
| OpenRouter Luna/Sol | Yes | No | Key stored in Railway service variable with owner approval; `AI_ENABLED=false`. No request was made. |
| Railway | Configured | Mock deployment/health only | No external CRM or AI call from health or startup in safe mode. |

Current HighLevel endpoint and response assumptions are based on official API documentation and still require Dmitry's later manual validation. The live sync, message send, task creation, note creation, transcription, and recording paths must be reviewed against current account scopes and provider responses during that owner-operated phase. Recording is shown only when the provider supplies a usable URL. Currency is displayed in USD because the prototype did; verify account currency before interpreting opportunity amounts.
