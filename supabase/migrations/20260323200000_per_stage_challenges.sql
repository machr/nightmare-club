-- Switch rotation_challenges to per-stage: one challenge per round_number

-- Drop existing table and all its policies cleanly
drop table if exists rotation_challenges cascade;

create table rotation_challenges (
  rotation_id uuid not null references rotations(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  primary key (rotation_id, round_number)
);

alter table rotation_challenges enable row level security;

create policy "Public read access" on rotation_challenges for select to anon, authenticated using (true);
create policy "Authenticated insert" on rotation_challenges for insert to authenticated with check (true);
create policy "Authenticated delete" on rotation_challenges for delete to authenticated using (true);
