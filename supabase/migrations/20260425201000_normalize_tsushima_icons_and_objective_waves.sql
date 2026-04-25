BEGIN;

UPDATE public.tsushima_maps AS t
SET
  week_options = (
    SELECT jsonb_agg(
      jsonb_set(
        wo.obj,
        '{modifiers}',
        (
          SELECT jsonb_agg(
            jsonb_set(
              m.mod,
              '{icon}',
              to_jsonb(replace(m.mod->>'icon', '-', '_'))
            )
            ORDER BY m.ord
          )
          FROM jsonb_array_elements(wo.obj->'modifiers') WITH ORDINALITY AS m(mod, ord)
        )
      )
      ORDER BY wo.ord
    )
    FROM jsonb_array_elements(t.week_options) WITH ORDINALITY AS wo(obj, ord)
  ),

  objectives = (
    WITH waves AS (
      SELECT *
      FROM unnest(ARRAY[2,4,7,10,13]) WITH ORDINALITY AS w(wave, ord)
    )
    SELECT jsonb_agg(
      jsonb_set(
        jsonb_set(
          o.obj,
          '{icon}',
          to_jsonb(replace(o.obj->>'icon', '-', '_'))
        ),
        '{wave}',
        to_jsonb(w.wave)
      )
      ORDER BY o.ord
    )
    FROM jsonb_array_elements(t.objectives) WITH ORDINALITY AS o(obj, ord)
    LEFT JOIN waves w ON w.ord = o.ord
  ),

  wave_modifiers = (
    SELECT jsonb_agg(
      jsonb_set(
        wm.obj,
        '{icon}',
        to_jsonb(replace(wm.obj->>'icon', '-', '_'))
      )
      ORDER BY wm.ord
    )
    FROM jsonb_array_elements(t.wave_modifiers) WITH ORDINALITY AS wm(obj, ord)
  );

COMMIT;
