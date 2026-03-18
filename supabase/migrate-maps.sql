-- Migration: Rename maps, add locations and slug columns
-- Run this in the Supabase SQL Editor to update an existing database.

-- Add slug column if missing
alter table maps add column if not exists slug text unique;

-- Add locations column if missing
alter table maps add column if not exists locations text[] not null default '{}';

-- Remove old maps (using name since slug may not have been populated)
delete from maps where name in ('Spider', 'Oni', 'Snake', 'Dragon');

-- Insert new maps with locations
insert into maps (name, slug, locations) values
  ('Hidden Temple', 'hidden-temple', '{"Pagoda","Cemetery","Courtyard"}'),
  ('Frozen Valley', 'frozen-valley', '{"Waterfall","Hillside","Armory"}'),
  ('Broken Castle', 'broken-castle', '{"Foundry","Burned Garden","Keep"}')
on conflict (name) do nothing;
