-- Add display_name column to admin_users for custom admin names (e.g. "Gestor Lima")
alter table admin_users
  add column if not exists display_name text default '';

-- Also add a policy so admins can update their own display_name
drop policy if exists "Admins can update own display_name" on admin_users;
create policy "Admins can update own display_name"
  on admin_users
  for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
