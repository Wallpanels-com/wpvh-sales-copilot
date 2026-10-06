-- Batch the lead list's contact, AI state, activity, and task lookups.
create index if not exists copilot_messages_contact_recent_idx
 on public.copilot_crm_messages_cache (location_id, contact_id, created_at desc);
create index if not exists copilot_tasks_contact_open_due_idx
 on public.copilot_crm_tasks_cache (location_id, contact_id, due_at)
 where completed=false;

create or replace view public.copilot_live_lead_rows with (security_invoker=true) as
select
 o.location_id,o.opportunity_id,o.contact_id,o.assigned_to,o.pipeline_name,o.pipeline_stage_name,
 o.status,o.monetary_value,o.name,o.source_updated_at,o.synced_at,
 c.first_name as contact_first_name,c.last_name as contact_last_name,c.company_name as contact_company_name,
 c.phone as contact_phone,c.email as contact_email,c.dnd as contact_dnd,
 s.attention_type as state_attention_type,s.priority as state_priority,
 s.next_best_action as state_next_best_action,s.reason as state_reason,
 s.relationship_summary as state_relationship_summary,s.draft_reply as state_draft_reply,
 s.critic_score as state_critic_score,
 latest.body as latest_body,latest.direction as latest_direction,
 latest.created_at as latest_created_at,latest.channel as latest_channel,
 inbound.body as last_inbound_body,inbound.created_at as last_inbound_at,
 human_outbound.created_at as last_human_outbound_at,
 open_task.due_at as open_task_due_at
from public.copilot_crm_opportunities_cache o
left join public.copilot_crm_contacts_cache c
 on c.location_id=o.location_id and c.contact_id=o.contact_id
left join public.copilot_ai_lead_state s
 on s.location_id=o.location_id and s.opportunity_id=o.opportunity_id
left join lateral (
 select m.body,m.direction,m.created_at,m.channel
 from public.copilot_crm_messages_cache m
 where m.location_id=o.location_id and m.contact_id=o.contact_id
 order by m.created_at desc nulls last limit 1
) latest on true
left join lateral (
 select m.body,m.created_at
 from public.copilot_crm_messages_cache m
 where m.location_id=o.location_id and m.contact_id=o.contact_id and m.direction='inbound'
 order by m.created_at desc nulls last limit 1
) inbound on true
left join lateral (
 select m.created_at
 from public.copilot_crm_messages_cache m
 where m.location_id=o.location_id and m.contact_id=o.contact_id
  and m.direction='outbound' and m.user_id=o.assigned_to
 order by m.created_at desc nulls last limit 1
) human_outbound on true
left join lateral (
 select t.due_at
 from public.copilot_crm_tasks_cache t
 where t.location_id=o.location_id and t.contact_id=o.contact_id and t.completed=false
 order by t.due_at asc nulls last limit 1
) open_task on true
where o.status='open';

revoke all on public.copilot_live_lead_rows from public,anon,authenticated;
grant select on public.copilot_live_lead_rows to service_role;
