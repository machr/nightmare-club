insert into challenges (name, description) values
  ('ranged-last-hit', 'Last hit requires Ranged or thrown weapon damage'),
  ('much-more-damage', 'Enemies deal much more damage'),
  ('increased-cooldowns', 'Role Ability cooldowns are increased'),
  ('unique-enemy-ambush', 'Unique Enemy Ambush')
on conflict (name) do nothing;
