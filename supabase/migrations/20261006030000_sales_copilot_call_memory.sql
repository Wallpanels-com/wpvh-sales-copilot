create table if not exists public.copilot_ai_call_state (
 location_id text not null,
 message_id text not null,
 opportunity_id text not null,
 context_hash text not null,
 summary jsonb not null,
 model_used text not null,
 generated_at timestamptz not null default now(),
 primary key(location_id,message_id)
);
alter table public.copilot_ai_call_state enable row level security;
revoke all on public.copilot_ai_call_state from anon, authenticated;
