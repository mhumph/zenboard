-- Delete default card/rows

delete from card where row_id = 1;

delete from row where id in (1, 2);


-- Create demo data

insert into row (position, title) values (1, 'Video player');

insert into row (position, title) values (2, 'Revenue');

insert into row (position, title) values (3, 'Maintenance');

insert into row (position, title) values (4, 'SEO');

insert into row (position, title) values (5, 'Page speed');

insert into row (position, title) values (6, 'Video: part 2');

insert into row (position, title) values (7, 'More maintenance');

insert into row (position, title) values (8, 'Images');

insert into row (position, title) values (9, 'Big ideas');


insert into card(position, title, row_id, col_id) values (
  1, 'Support embedding on 3rd party sites', (SELECT id FROM row WHERE title = 'Video player'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Custom editor: waiting on @cc', (SELECT id FROM row WHERE title = 'Video player'), 2);

insert into card(position, title, row_id, col_id) values (
  1, 'WordPress integration @mh', (SELECT id FROM row WHERE title = 'Video player'), 3);

insert into card(position, title, row_id, col_id) values (
  2, 'Video API @h', (SELECT id FROM row WHERE title = 'Video player'), 3);

insert into card(position, title, row_id, col_id) values (
  3, 'Share buttons @s', (SELECT id FROM row WHERE title = 'Video player'), 3);

insert into card(position, title, row_id, col_id) values (
  4, 'Support expiry date @s @g', (SELECT id FROM row WHERE title = 'Video player'), 3);

insert into card(position, title, row_id, col_id) values (
  1, 'Mock API @h @s', (SELECT id FROM row WHERE title = 'Video player'), 4);

insert into card(position, title, row_id, col_id) values (
  2, 'Minimal VJS player @s', (SELECT id FROM row WHERE title = 'Video player'), 4);

insert into card(position, title, row_id, col_id) values (
  3, 'Setup CDN', (SELECT id FROM row WHERE title = 'Video player'), 4);


insert into card(position, title, row_id, col_id) values (
  1, 'Pre-roll @s', (SELECT id FROM row WHERE title = 'Revenue'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'New header bidding adapter @s', (SELECT id FROM row WHERE title = 'Revenue'), 1);

insert into card(position, title, row_id, col_id) values (
  3, 'Geo-targeting PoC', (SELECT id FROM row WHERE title = 'Revenue'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Taboola changes: waiting on @al', (SELECT id FROM row WHERE title = 'Revenue'), 2);

insert into card(position, title, row_id, col_id) values (
  1, 'Gaming partnership @mh', (SELECT id FROM row WHERE title = 'Revenue'), 3);


insert into card(position, title, row_id, col_id) values (
  1, 'Fix missing SEO fields', (SELECT id FROM row WHERE title = 'Maintenance'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'Fix AB headlines #analytics @mh', (SELECT id FROM row WHERE title = 'Maintenance'), 1);

insert into card(position, title, row_id, col_id) values (
  1, '#images enhanced metadata @mr', (SELECT id FROM row WHERE title = 'Maintenance'), 2);

insert into card(position, title, row_id, col_id) values (
  1, 'Speed up image search @a', (SELECT id FROM row WHERE title = 'Maintenance'), 3);

insert into card(position, title, row_id, col_id) values (
  1, 'Zone fix @a', (SELECT id FROM row WHERE title = 'Maintenance'), 4);


insert into card(position, title, row_id, col_id) values (
  1, 'Sitemap enhancements', (SELECT id FROM row WHERE title = 'SEO'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'Tag page enhancements', (SELECT id FROM row WHERE title = 'SEO'), 1);

insert into card(position, title, row_id, col_id) values (
  3, 'RSS enhancements', (SELECT id FROM row WHERE title = 'SEO'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Investigate sitemaps @mh', (SELECT id FROM row WHERE title = 'SEO'), 3);


insert into card(position, title, row_id, col_id) values (
  1, 'Investigate GPSI reports', (SELECT id FROM row WHERE title = 'Page speed'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'Lazy load images', (SELECT id FROM row WHERE title = 'Page speed'), 1);

insert into card(position, title, row_id, col_id) values (
  3, 'Remove customiser CSS', (SELECT id FROM row WHERE title = 'Page speed'), 1);

insert into card(position, title, row_id, col_id) values (
  4, 'Avoid redirect', (SELECT id FROM row WHERE title = 'Page speed'), 1);

insert into card(position, title, row_id, col_id) values (
  5, 'Track page speed over time #analytics', (SELECT id FROM row WHERE title = 'Page speed'), 1);


insert into card(position, title, row_id, col_id) values (
  1, '#Analytics enhancements', (SELECT id FROM row WHERE title = 'Video: part 2'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Recommendations', (SELECT id FROM row WHERE title = 'Video: part 2'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Video strip', (SELECT id FROM row WHERE title = 'Video: part 2'), 1);


insert into card(position, title, row_id, col_id) values (
  1, 'Fix RSS titles', (SELECT id FROM row WHERE title = 'More maintenance'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'Monitor mobile articles', (SELECT id FROM row WHERE title = 'More maintenance'), 1);


insert into card(position, title, row_id, col_id) values (
  1, 'Galleries', (SELECT id FROM row WHERE title = 'Images'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'Enhanced cropping', (SELECT id FROM row WHERE title = 'Images'), 1);

insert into card(position, title, row_id, col_id) values (
  3, 'AB images #analytics', (SELECT id FROM row WHERE title = 'Images'), 1);

insert into card(position, title, row_id, col_id) values (
  4, 'Breaking News enhancements', (SELECT id FROM row WHERE title = 'Images'), 1);


insert into card(position, title, row_id, col_id) values (
  1, 'New hero widget', (SELECT id FROM row WHERE title = 'Misc'), 1);

insert into card(position, title, row_id, col_id) values (
  2, 'Curator', (SELECT id FROM row WHERE title = 'Misc'), 1);

insert into card(position, title, row_id, col_id) values (
  3, 'Newsletters', (SELECT id FROM row WHERE title = 'Misc'), 1);

insert into card(position, title, row_id, col_id) values (
  4, 'HTTPS', (SELECT id FROM row WHERE title = 'Misc'), 1);

insert into card(position, title, row_id, col_id) values (
  5, 'Sport focus: PL table, personalised team news, etc', (SELECT id FROM row WHERE title = 'Misc'), 1);

insert into card(position, title, row_id, col_id) values (
  6, 'Apple News', (SELECT id FROM row WHERE title = 'Misc'), 1);


insert into card(position, title, row_id, col_id) values (
  1, 'UGC', (SELECT id FROM row WHERE title = 'Big ideas'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Aggregation', (SELECT id FROM row WHERE title = 'Big ideas'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'Realtime messaging', (SELECT id FROM row WHERE title = 'Big ideas'), 1);

insert into card(position, title, row_id, col_id) values (
  1, 'PWA', (SELECT id FROM row WHERE title = 'Big ideas'), 1);
