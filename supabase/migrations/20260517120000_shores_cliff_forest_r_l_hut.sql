-- Shores of Vengeance: Cliff spawns → Forest R, Forest L, Hut
update tsushima_maps m
set zones = (
  select jsonb_agg(
    case
      when z->>'zone' = 'Cliff'
        then jsonb_set(z, '{spawns}', '["Forest R","Forest L","Hut"]'::jsonb, false)
      else z
    end
  )
  from jsonb_array_elements(m.zones) as z
)
where m.slug = 'the-shores-of-vengeance';
