-- Allow multiple challenges per stage (round_number) by changing the primary key
-- from (rotation_id, round_number) to (rotation_id, round_number, challenge_id).

drop table if exists rotation_challenges cascade;

create table rotation_challenges (
  rotation_id uuid not null references rotations(id) on delete cascade,
  challenge_id uuid not null references challenges(id) on delete cascade,
  round_number int not null check (round_number between 1 and 4),
  primary key (rotation_id, round_number, challenge_id)
);

alter table rotation_challenges enable row level security;

create policy "Public read access" on rotation_challenges for select to anon, authenticated using (true);
create policy "Authenticated insert" on rotation_challenges for insert to authenticated with check (true);
create policy "Authenticated delete" on rotation_challenges for delete to authenticated using (true);

-- Recreate index for the foreign key
create index if not exists idx_rotation_challenges_challenge_id
  on rotation_challenges (challenge_id);

-- Recreate the upsert RPC (no logic change — it already loops over the challenges
-- array; the only thing that changed is the table constraint allowing duplicates
-- on round_number).
create or replace function upsert_rotation(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_rotation_id uuid;
  v_map_id uuid := (payload->>'map_id')::uuid;
  v_week_start date := (payload->>'week_start')::date;
  v_credit_text text := payload->>'credit_text';
  v_existing_id uuid;
  v_round jsonb;
  v_round_id uuid;
  v_wave jsonb;
  v_wave_id uuid;
  v_spawn jsonb;
  v_challenge jsonb;
begin
  -- 1. Delete existing rotation for this map+week (cascades to all children)
  select id into v_existing_id
    from rotations
   where map_id = v_map_id and week_start = v_week_start;

  if v_existing_id is not null then
    delete from rotations where id = v_existing_id;
  end if;

  -- 2. Insert rotation
  insert into rotations (map_id, week_start, credit_text)
    values (v_map_id, v_week_start, v_credit_text)
    returning id into v_rotation_id;

  -- 3. Insert rotation_challenges (now supports multiple per round)
  for v_challenge in select value from jsonb_array_elements(
    coalesce(payload->'challenges', '[]'::jsonb)
  ) loop
    insert into rotation_challenges (rotation_id, challenge_id, round_number)
    values (
      v_rotation_id,
      (v_challenge->>'challenge_id')::uuid,
      (v_challenge->>'round_number')::int
    );
  end loop;

  -- 4. Insert rounds -> waves -> spawns (nested loops, all in-process)
  for v_round in select value from jsonb_array_elements(payload->'rounds') loop
    insert into rounds (rotation_id, round_number)
    values (v_rotation_id, (v_round->>'round_number')::int)
    returning id into v_round_id;

    for v_wave in select value from jsonb_array_elements(v_round->'waves') loop
      insert into waves (round_id, wave_number)
      values (v_round_id, (v_wave->>'wave_number')::int)
      returning id into v_wave_id;

      for v_spawn in select value from jsonb_array_elements(v_wave->'spawns') loop
        insert into spawns (round_id, spawn_order, location, spawn_point, element)
        values (
          v_wave_id,
          (v_spawn->>'spawn_order')::int,
          v_spawn->>'location',
          v_spawn->>'spawn_point',
          coalesce(
            (select array_agg(e::text)
             from jsonb_array_elements_text(v_spawn->'element') as e),
            '{}'::text[]
          )
        );
      end loop;
    end loop;
  end loop;

  return v_rotation_id;
end;
$$;
