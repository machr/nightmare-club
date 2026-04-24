-- Add missing Tsushima spawn option for Twilight and Ashes.
-- Lighthouse zone should allow: Side, Boulder, Cliff.
update tsushima_maps m
set zones = (
  select jsonb_agg(
    case
      when z->>'zone' = 'Lighthouse'
        then jsonb_set(z, '{spawns}', '["Side","Boulder","Cliff"]'::jsonb, false)
      else z
    end
  )
  from jsonb_array_elements(m.zones) as z
)
where m.slug = 'twilight-and-ashes';
