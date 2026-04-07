insert into challenges (name, description) values
  ('max-health-significantly-reduced', 'Max Health significantly Reduced'),
  ('reviving-ghosts-much-longer', 'Reviving Ghosts takes much longer'),
  ('ghost-weapon-cooldowns-increased', 'Ghost Weapon cooldowns are increased')
on conflict (name) do nothing;
