insert into challenges (name, description) values
  ('spirit-healing-disabled', 'Spirit Healing disabled')
on conflict (name) do nothing;
