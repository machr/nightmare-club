-- Add placeholder challenges
insert into challenges (name, description) values
  ('enemy-ambush', 'Enemy Ambush'),
  ('reduced-healing', 'Reduced Healing'),
  ('lose-a-point', 'Lose a point at the beginning of the round'),
  ('fast-attacks', 'Enemies have fast attacks'),
  ('hit-harder', 'Enemies hit harder')
on conflict (name) do nothing;

-- Junction table for many-to-many rotations <-> challenges
create table if not exists rotation_challenges (
  rotation_id uuid not null references rotations(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  primary key (rotation_id, challenge_id)
);

alter table rotation_challenges enable row level security;

create policy "Public read access" on rotation_challenges for select to anon, authenticated using (true);
create policy "Authenticated insert" on rotation_challenges for insert to authenticated with check (true);
create policy "Authenticated delete" on rotation_challenges for delete to authenticated using (true);
