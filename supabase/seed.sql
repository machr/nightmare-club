-- Example seed data: Full Hidden Temple rotation for the current week
-- Run this AFTER schema.sql in the Supabase SQL Editor.

do $$
declare
  v_map_id uuid;
  v_rotation_id uuid;
  v_stage_id uuid;
  v_round_id uuid;
  v_modifier_fire uuid;
  v_modifier_ice uuid;
  v_modifier_shadow uuid;
  v_modifier_void uuid;
  v_week_start date;
begin
  -- Calculate most recent Saturday
  v_week_start := current_date - ((extract(dow from current_date)::int + 1) % 7);

  -- Get map and modifier IDs
  select id into v_map_id from maps where slug = 'hidden-temple';
  select id into v_modifier_fire from modifiers where name = 'Fire';
  select id into v_modifier_ice from modifiers where name = 'Ice';
  select id into v_modifier_shadow from modifiers where name = 'Shadow';
  select id into v_modifier_void from modifiers where name = 'Void';

  -- Create rotation
  insert into rotations (map_id, week_start)
    values (v_map_id, v_week_start)
    returning id into v_rotation_id;

  -- ========== Stage 1 (Fire modifier, 3 spawns per round) ==========
  insert into stages (rotation_id, stage_number, modifier_id)
    values (v_rotation_id, 1, v_modifier_fire)
    returning id into v_stage_id;

  -- Round 1
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 1) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Pagoda', 'Sun'),
    (v_round_id, 2, 'Cemetery', 'Moon'),
    (v_round_id, 3, 'Courtyard', 'Storm');

  -- Round 2
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 2) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Courtyard', 'Sun'),
    (v_round_id, 2, 'Pagoda', 'Storm'),
    (v_round_id, 3, 'Cemetery', 'Moon');

  -- Round 3
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 3) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Cemetery', 'Storm'),
    (v_round_id, 2, 'Courtyard', 'Sun'),
    (v_round_id, 3, 'Pagoda', 'Moon');

  -- ========== Stage 2 (Ice modifier) ==========
  insert into stages (rotation_id, stage_number, modifier_id)
    values (v_rotation_id, 2, v_modifier_ice)
    returning id into v_stage_id;

  -- Round 1
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 1) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Pagoda', 'Moon'),
    (v_round_id, 2, 'Courtyard', 'Sun'),
    (v_round_id, 3, 'Cemetery', 'Storm');

  -- Round 2
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 2) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Cemetery', 'Sun'),
    (v_round_id, 2, 'Pagoda', 'Moon'),
    (v_round_id, 3, 'Courtyard', 'Storm');

  -- Round 3
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 3) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Courtyard', 'Moon'),
    (v_round_id, 2, 'Cemetery', 'Sun'),
    (v_round_id, 3, 'Pagoda', 'Storm');

  -- ========== Stage 3 (Shadow modifier) ==========
  insert into stages (rotation_id, stage_number, modifier_id)
    values (v_rotation_id, 3, v_modifier_shadow)
    returning id into v_stage_id;

  -- Round 1
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 1) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Cemetery', 'Sun'),
    (v_round_id, 2, 'Pagoda', 'Storm'),
    (v_round_id, 3, 'Courtyard', 'Moon');

  -- Round 2
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 2) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Pagoda', 'Moon'),
    (v_round_id, 2, 'Courtyard', 'Storm'),
    (v_round_id, 3, 'Cemetery', 'Sun');

  -- Round 3
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 3) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Courtyard', 'Storm'),
    (v_round_id, 2, 'Cemetery', 'Moon'),
    (v_round_id, 3, 'Pagoda', 'Sun');

  -- ========== Stage 4 (Void modifier, 4 spawns per round) ==========
  insert into stages (rotation_id, stage_number, modifier_id)
    values (v_rotation_id, 4, v_modifier_void)
    returning id into v_stage_id;

  -- Round 1
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 1) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Pagoda', 'Sun'),
    (v_round_id, 2, 'Cemetery', 'Moon'),
    (v_round_id, 3, 'Courtyard', 'Storm'),
    (v_round_id, 4, 'Pagoda', 'Moon');

  -- Round 2
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 2) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Courtyard', 'Moon'),
    (v_round_id, 2, 'Pagoda', 'Storm'),
    (v_round_id, 3, 'Cemetery', 'Sun'),
    (v_round_id, 4, 'Courtyard', 'Sun');

  -- Round 3
  insert into rounds (stage_id, round_number)
    values (v_stage_id, 3) returning id into v_round_id;
  insert into spawns (round_id, spawn_index, location, element) values
    (v_round_id, 1, 'Cemetery', 'Storm'),
    (v_round_id, 2, 'Courtyard', 'Sun'),
    (v_round_id, 3, 'Pagoda', 'Moon'),
    (v_round_id, 4, 'Cemetery', 'Storm');

end $$;
