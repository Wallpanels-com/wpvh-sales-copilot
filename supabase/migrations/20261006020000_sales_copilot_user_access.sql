-- The browser never queries these tables. The API may use the signed-in user's JWT
-- for mock-mode profile, mapping, preferences, and personal lessons when no
-- service-role credential has been configured yet.
grant select on public.copilot_profiles to authenticated;
create policy copilot_profile_self_select on public.copilot_profiles for select to authenticated using (id = (select auth.uid()));
grant select on public.copilot_user_ghl_mappings to authenticated;
create policy copilot_mapping_self_select on public.copilot_user_ghl_mappings for select to authenticated using (profile_id = (select auth.uid()));
grant select, insert, update on public.copilot_user_preferences to authenticated;
create policy copilot_preferences_self_select on public.copilot_user_preferences for select to authenticated using (profile_id = (select auth.uid()));
create policy copilot_preferences_self_insert on public.copilot_user_preferences for insert to authenticated with check (profile_id = (select auth.uid()));
create policy copilot_preferences_self_update on public.copilot_user_preferences for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));
grant select, insert on public.copilot_ai_lessons to authenticated;
create policy copilot_lessons_self_select on public.copilot_ai_lessons for select to authenticated using (scope = 'user' and profile_id = (select auth.uid()));
create policy copilot_lessons_self_insert on public.copilot_ai_lessons for insert to authenticated with check (scope = 'user' and profile_id = (select auth.uid()));
