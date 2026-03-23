-- Fix map names: Spider is River Village, Snake is Hidden Temple
update maps set name = 'The Spider (River Village)' where slug = 'river-village';
update maps set name = 'The Snake (Hidden Temple)' where slug = 'hidden-temple';
