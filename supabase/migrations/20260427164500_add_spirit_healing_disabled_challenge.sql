insert into challenges (name, description) values
  ('spirit-healing-disabled', 'Spirit Healing is disabled')
on conflict (name) do nothing;
