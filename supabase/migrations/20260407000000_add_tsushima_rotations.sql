create table if not exists tsushima_maps (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  zones jsonb not null,
  week_options jsonb not null,
  objectives jsonb not null,
  wave_modifiers jsonb not null
);

create table if not exists tsushima_rotations (
  id uuid primary key default gen_random_uuid(),
  map_id uuid not null references tsushima_maps(id) on delete cascade,
  week_start date not null,
  week_code text not null,
  credit_text text,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (map_id, week_start)
);

alter table tsushima_maps enable row level security;
alter table tsushima_rotations enable row level security;

create policy "Public read access" on tsushima_maps for select to anon, authenticated using (true);
create policy "Public read access" on tsushima_rotations for select to anon, authenticated using (true);

insert into tsushima_maps (slug, name, zones, week_options, objectives, wave_modifiers) values
  (
    'the-defence-of-aoi-village',
    'The Defense of Aoi Village',
    '[
      {"zone":"Villa","spawns":["Villa"]},
      {"zone":"Stable","spawns":["Beach","Hut"]},
      {"zone":"Farm","spawns":["Left","Right"]}
    ]'::jsonb,
    '[
      {"code":"1.3","modifiers":[{"slot":1,"name":"Slowed Revives","icon":"slowed-revives-backdrop.svg"},{"slot":2,"name":"Disciples of Iyo","icon":"disciples-of-iyo-hazard.svg"}]},
      {"code":"2.1","modifiers":[{"slot":1,"name":"Slowed Revives","icon":"slowed-revives-wmod.svg"},{"slot":2,"name":"Eyes of Iyo","icon":"eyes-of-iyo-hazard.svg"}]},
      {"code":"2.5","modifiers":[{"slot":1,"name":"Reduced Healing","icon":"reduced-healing-wmod.svg"},{"slot":2,"name":"Fire Spirits","icon":"fire-spirits-hazard.svg"}]}
    ]'::jsonb,
    '[
      {"slot":1,"name":"Perform Perfect Parry counterattacks.","icon":"perfect-parry-counters-alt.svg","target":15},
      {"slot":2,"name":"Conquer enemies outside defense areas.","icon":"outside-zone-kills-backdrop.svg","target":25},
      {"slot":3,"name":"Assassinate enemies from above.","icon":"assassinate-from-above-alt.svg","target":5},
      {"slot":4,"name":"Defeat enemies with ranged attacks.","icon":"ranged-kills-alt.svg","target":20},
      {"slot":5,"name":"Destroy enemies with fire damage.","icon":"fire-dmg-kills-alt.svg","target":15}
    ]'::jsonb,
    '[
      {"wave":3,"name":"Toxic Clouds","icon":"toxic-clouds-backdrop.svg"},
      {"wave":6,"name":"Fighting Blind","icon":"fighting-blind-backdrop.svg"},
      {"wave":9,"name":"Eruption","icon":"eruption-backdrop.svg"},
      {"wave":12,"name":"Fighting Blind","icon":"fighting-blind-backdrop.svg"},
      {"wave":15,"name":"Eruption","icon":"eruption-backdrop.svg"}
    ]'::jsonb
  ),
  (
    'blood-and-steel',
    'Blood and Steel',
    '[
      {"zone":"Camp","spawns":["Left","Right"]},
      {"zone":"Island","spawns":["Left","Cart"]},
      {"zone":"Cliff","spawns":["Top","Cart"]}
    ]'::jsonb,
    '[
      {"code":"1.6","modifiers":[{"slot":1,"name":"Tool Shortage","icon":"tool-shortage-backdrop.svg"},{"slot":2,"name":"Eyes of Iyo","icon":"eyes-of-iyo-hazard.svg"}]},
      {"code":"2.4","modifiers":[{"slot":1,"name":"Incapacitated","icon":"incapacitated-wmod.svg"},{"slot":2,"name":"Disciples of Iyo","icon":"disciples-of-iyo-hazard.svg"}]}
    ]'::jsonb,
    '[
      {"slot":1,"name":"Defeat enemies with Assassinations or critical strikes.","icon":"assassinations-alt.svg","target":10},
      {"slot":2,"name":"Defeat enemies inside defense areas.","icon":"inside-zone-kills-backdrop.svg","target":25},
      {"slot":3,"name":"Shoot enemies with headshots.","icon":"headshots-alt.svg","target":25},
      {"slot":4,"name":"Assassinate enemies from above.","icon":"assassinate-from-above-alt.svg","target":5},
      {"slot":5,"name":"Perform Perfect Parry counterattacks.","icon":"perfect-parry-counters-alt.svg","target":15}
    ]'::jsonb,
    '[
      {"wave":3,"name":"Fighting Blind","icon":"fighting-blind-backdrop.svg"},
      {"wave":6,"name":"Slowed Revives","icon":"slowed-revives-backdrop.svg"},
      {"wave":9,"name":"Burning Blades","icon":"burning-blades-backdrop.svg"},
      {"wave":12,"name":"Toxic Clouds","icon":"toxic-clouds-backdrop.svg"},
      {"wave":15,"name":"Eruption","icon":"eruption-backdrop.svg"}
    ]'::jsonb
  ),
  (
    'blood-in-the-snow',
    'Blood in the Snow',
    '[
      {"zone":"Mine","spawns":["Mine"]},
      {"zone":"Outpost","spawns":["Outpost"]},
      {"zone":"Camp","spawns":["Camp"]}
    ]'::jsonb,
    '[
      {"code":"1.2","modifiers":[{"slot":1,"name":"Immunity","icon":"immunity-backdrop.svg"},{"slot":2,"name":"Fire Spirits","icon":"fire-spirits-hazard.svg"}]},
      {"code":"2.2","modifiers":[{"slot":1,"name":"Incapacitated","icon":"incapacitated-wmod.svg"},{"slot":2,"name":"Fire Spirits","icon":"fire-spirits-hazard.svg"}]}
    ]'::jsonb,
    '[
      {"slot":1,"name":"Shoot enemies with headshots.","icon":"headshots-alt.svg","target":25},
      {"slot":2,"name":"Defeat enemies inside defense areas.","icon":"inside-zone-kills-backdrop.svg","target":25},
      {"slot":3,"name":"Defeat enemies with Ghost weapons.","icon":"ghost-weapon-kills-backdrop.svg","target":5},
      {"slot":4,"name":"Destroy enemies with fire damage.","icon":"fire-dmg-kills-alt.svg","target":15},
      {"slot":5,"name":"Conquer enemies outside defense areas.","icon":"outside-zone-kills-backdrop.svg","target":25}
    ]'::jsonb,
    '[
      {"wave":3,"name":"Wildfire","icon":"wildfire-backdrop.svg"},
      {"wave":6,"name":"Eruption","icon":"eruption-backdrop.svg"},
      {"wave":9,"name":"Fighting Blind","icon":"fighting-blind-backdrop.svg"},
      {"wave":12,"name":"Burning Blades","icon":"burning-blades-backdrop.svg"},
      {"wave":15,"name":"Eruption","icon":"eruption-backdrop.svg"}
    ]'::jsonb
  ),
  (
    'the-shadows-of-war',
    'The Shadows of War',
    '[
      {"zone":"Stable","spawns":["Stable"]},
      {"zone":"Barracks","spawns":["Left","Middle","Right"]},
      {"zone":"Dojo","spawns":["Left","Right","Deep"]}
    ]'::jsonb,
    '[
      {"code":"1.4","modifiers":[{"slot":1,"name":"Reduced Healing","icon":"reduced-healing-wmod.svg"},{"slot":2,"name":"Eyes of Iyo","icon":"eyes-of-iyo-hazard.svg"}]},
      {"code":"1.7","modifiers":[{"slot":1,"name":"Reduced Healing","icon":"reduced-healing-wmod.svg"},{"slot":2,"name":"Fire Spirits","icon":"fire-spirits-hazard.svg"}]},
      {"code":"2.6","modifiers":[{"slot":1,"name":"Empowered Foes","icon":"empowered-foes-wmod.svg"},{"slot":2,"name":"Eyes of Iyo","icon":"eyes-of-iyo-hazard.svg"}]}
    ]'::jsonb,
    '[
      {"slot":1,"name":"Shoot enemies with headshots.","icon":"headshots-alt.svg","target":25},
      {"slot":2,"name":"Defeat enemies inside defense areas.","icon":"inside-zone-kills-backdrop.svg","target":25},
      {"slot":3,"name":"Defeat enemies with Ghost weapons.","icon":"ghost-weapon-kills-backdrop.svg","target":5},
      {"slot":4,"name":"Destroy enemies with fire damage.","icon":"fire-dmg-kills-alt.svg","target":15},
      {"slot":5,"name":"Conquer enemies outside defense areas.","icon":"outside-zone-kills-backdrop.svg","target":25}
    ]'::jsonb,
    '[
      {"wave":3,"name":"Fighting Blind","icon":"fighting-blind-backdrop.svg"},
      {"wave":6,"name":"Burning Blades","icon":"burning-blades-backdrop.svg"},
      {"wave":9,"name":"Toxic Clouds","icon":"toxic-clouds-backdrop.svg"},
      {"wave":12,"name":"Wildfire","icon":"wildfire-backdrop.svg"},
      {"wave":15,"name":"Eruption","icon":"eruption-backdrop.svg"}
    ]'::jsonb
  ),
  (
    'the-shores-of-vengeance',
    'The Shores of Vengeance',
    '[
      {"zone":"Cliff","spawns":["Forest","Hut"]},
      {"zone":"Boat","spawns":["Boat"]},
      {"zone":"Beach","spawns":["Beach"]}
    ]'::jsonb,
    '[
      {"code":"1.1","modifiers":[{"slot":1,"name":"Tool Shortage","icon":"tool-shortage-backdrop.svg"},{"slot":2,"name":"Eyes of Iyo","icon":"eyes-of-iyo-hazard.svg"}]},
      {"code":"1.8","modifiers":[{"slot":1,"name":"Empowered Foes","icon":"empowered-foes-wmod.svg"},{"slot":2,"name":"Disciples of Iyo","icon":"disciples-of-iyo-hazard.svg"}]},
      {"code":"2.8","modifiers":[{"slot":1,"name":"Slowed Revives","icon":"slowed-revives-wmod.svg"},{"slot":2,"name":"Disciples of Iyo","icon":"disciples-of-iyo-hazard.svg"}]}
    ]'::jsonb,
    '[
      {"slot":1,"name":"Defeat enemies with ranged attacks.","icon":"ranged-kills-alt.svg","target":20},
      {"slot":2,"name":"Defeat enemies inside defense areas.","icon":"inside-zone-kills-backdrop.svg","target":25},
      {"slot":3,"name":"Defeat enemies with Ghost weapons.","icon":"ghost-weapon-kills-backdrop.svg","target":5},
      {"slot":4,"name":"Defeat enemies with Assassinations or critical strikes.","icon":"assassinations-alt.svg","target":10},
      {"slot":5,"name":"Shoot enemies with headshots.","icon":"headshots-alt.svg","target":25}
    ]'::jsonb,
    '[
      {"wave":3,"name":"Eruption","icon":"eruption-backdrop.svg"},
      {"wave":6,"name":"Toxic Clouds","icon":"toxic-clouds-backdrop.svg"},
      {"wave":9,"name":"Burning Blades","icon":"burning-blades-backdrop.svg"},
      {"wave":12,"name":"Wildfire","icon":"wildfire-backdrop.svg"},
      {"wave":15,"name":"Eruption","icon":"eruption-backdrop.svg"}
    ]'::jsonb
  ),
  (
    'twilight-and-ashes',
    'Twilight and Ashes',
    '[
      {"zone":"Obelisk","spawns":["Obelisk"]},
      {"zone":"Ledge","spawns":["Cliff","Boulder"]},
      {"zone":"Lighthouse","spawns":["Side","Boulder"]}
    ]'::jsonb,
    '[
      {"code":"1.5","modifiers":[{"slot":1,"name":"Incapacitated","icon":"incapacitated-wmod.svg"},{"slot":2,"name":"Disciples of Iyo","icon":"disciples-of-iyo-hazard.svg"}]},
      {"code":"2.3","modifiers":[{"slot":1,"name":"Empowered Foes","icon":"empowered-foes-wmod.svg"},{"slot":2,"name":"Eyes of Iyo","icon":"eyes-of-iyo-hazard.svg"}]},
      {"code":"2.7","modifiers":[{"slot":1,"name":"Incapacitated","icon":"incapacitated-wmod.svg"},{"slot":2,"name":"Fire Spirits","icon":"fire-spirits-hazard.svg"}]}
    ]'::jsonb,
    '[
      {"slot":1,"name":"Shoot enemies with headshots.","icon":"headshots-alt.svg","target":25},
      {"slot":2,"name":"Assassinate enemies from above.","icon":"assassinate-from-above-alt.svg","target":5},
      {"slot":3,"name":"Destroy enemies with fire damage.","icon":"fire-dmg-kills-alt.svg","target":15},
      {"slot":4,"name":"Conquer enemies outside defense areas.","icon":"outside-zone-kills-backdrop.svg","target":25},
      {"slot":5,"name":"Defeat enemies with Ghost weapons.","icon":"ghost-weapon-kills-backdrop.svg","target":5}
    ]'::jsonb,
    '[
      {"wave":3,"name":"Toxic Clouds","icon":"toxic-clouds-backdrop.svg"},
      {"wave":6,"name":"Wildfire","icon":"wildfire-backdrop.svg"},
      {"wave":9,"name":"Fighting Blind","icon":"fighting-blind-backdrop.svg"},
      {"wave":12,"name":"Immunity","icon":"immunity-backdrop.svg"},
      {"wave":15,"name":"Eruption","icon":"eruption-backdrop.svg"}
    ]'::jsonb
  )
on conflict (slug) do update
set
  name = excluded.name,
  zones = excluded.zones,
  week_options = excluded.week_options,
  objectives = excluded.objectives,
  wave_modifiers = excluded.wave_modifiers;

create or replace function upsert_tsushima_rotation(payload jsonb)
returns uuid
language plpgsql
security invoker
as $$
declare
  v_rotation_id uuid;
  v_map_id uuid := (payload->>'map_id')::uuid;
  v_week_start date := (payload->>'week_start')::date;
  v_week_code text := payload->>'week_code';
  v_credit_text text := payload->>'credit_text';
  v_payload jsonb := payload->'payload';
begin
  insert into tsushima_rotations (map_id, week_start, week_code, credit_text, payload)
  values (v_map_id, v_week_start, v_week_code, v_credit_text, v_payload)
  on conflict (map_id, week_start) do update
    set week_code = excluded.week_code,
        credit_text = excluded.credit_text,
        payload = excluded.payload,
        updated_at = now()
  returning id into v_rotation_id;

  return v_rotation_id;
end;
$$;
