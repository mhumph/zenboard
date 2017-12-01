CREATE TABLE `row` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) NOT NULL,
  `my_order` int(11) NOT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `info` VARCHAR(512) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


insert into row (my_order, label) values (1, 'Video player');

insert into row (my_order, label) values (2, 'Revenue');

insert into row (my_order, label) values (3, 'Maintenance');

insert into row (my_order, label) values (4, 'SEO');

insert into row (my_order, label) values (5, 'Page speed');

insert into row (my_order, label) values (6, 'Video: part 2');

insert into row (my_order, label) values (7, 'More maintenance');

insert into row (my_order, label) values (8, 'Images');

insert into row (my_order, label) values (9, 'Big ideas');


CREATE TABLE `task` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(512) NOT NULL,
  `row_id` INT NULL,
  `col_id` INT NULL,
  `my_order` INT NOT NULL,
  `description` LONGTEXT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));


insert into task(my_order, label, row_id, col_id) values (
  1, 'Support embedding on 3rd party sites', (SELECT id FROM row WHERE label = 'Video player'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Custom editor: waiting on @cc', (SELECT id FROM row WHERE label = 'Video player'), 2);

insert into task(my_order, label, row_id, col_id) values (
  1, 'WordPress integration @mh', (SELECT id FROM row WHERE label = 'Video player'), 3);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Video API @h', (SELECT id FROM row WHERE label = 'Video player'), 3);

insert into task(my_order, label, row_id, col_id) values (
  3, 'Share buttons @s', (SELECT id FROM row WHERE label = 'Video player'), 3);

insert into task(my_order, label, row_id, col_id) values (
  4, 'Support expiry date @s @g', (SELECT id FROM row WHERE label = 'Video player'), 3);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Mock API @h @s', (SELECT id FROM row WHERE label = 'Video player'), 4);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Minimal VJS player @s', (SELECT id FROM row WHERE label = 'Video player'), 4);

insert into task(my_order, label, row_id, col_id) values (
  3, 'Setup CDN', (SELECT id FROM row WHERE label = 'Video player'), 4);


insert into task(my_order, label, row_id, col_id) values (
  1, 'Pre-roll @s', (SELECT id FROM row WHERE label = 'Revenue'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'New header bidding adapter @s', (SELECT id FROM row WHERE label = 'Revenue'), 1);

insert into task(my_order, label, row_id, col_id) values (
  3, 'Geo-targeting PoC', (SELECT id FROM row WHERE label = 'Revenue'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Taboola changes: waiting on @al', (SELECT id FROM row WHERE label = 'Revenue'), 2);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Gaming partnership @mh', (SELECT id FROM row WHERE label = 'Revenue'), 3);


insert into task(my_order, label, row_id, col_id) values (
  1, 'Fix missing SEO fields', (SELECT id FROM row WHERE label = 'Maintenance'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Fix AB headlines #analytics @mh', (SELECT id FROM row WHERE label = 'Maintenance'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, '#images enhanced metadata @mr', (SELECT id FROM row WHERE label = 'Maintenance'), 2);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Speed up image search @a', (SELECT id FROM row WHERE label = 'Maintenance'), 3);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Zone fix @a', (SELECT id FROM row WHERE label = 'Maintenance'), 4);


insert into task(my_order, label, row_id, col_id) values (
  1, 'Sitemap enhancements', (SELECT id FROM row WHERE label = 'SEO'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Tag page enhancements', (SELECT id FROM row WHERE label = 'SEO'), 1);

insert into task(my_order, label, row_id, col_id) values (
  3, 'RSS enhancements', (SELECT id FROM row WHERE label = 'SEO'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Investigate sitemaps @mh', (SELECT id FROM row WHERE label = 'SEO'), 3);


insert into task(my_order, label, row_id, col_id) values (
  1, 'Investigate GPSI reports', (SELECT id FROM row WHERE label = 'Page speed'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Lazy load images', (SELECT id FROM row WHERE label = 'Page speed'), 1);

insert into task(my_order, label, row_id, col_id) values (
  3, 'Remove customiser CSS', (SELECT id FROM row WHERE label = 'Page speed'), 1);

insert into task(my_order, label, row_id, col_id) values (
  4, 'Avoid redirect', (SELECT id FROM row WHERE label = 'Page speed'), 1);

insert into task(my_order, label, row_id, col_id) values (
  5, 'Track page speed over time #analytics', (SELECT id FROM row WHERE label = 'Page speed'), 1);


insert into task(my_order, label, row_id, col_id) values (
  1, '#Analytics enhancements', (SELECT id FROM row WHERE label = 'Video: part 2'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Recommendations', (SELECT id FROM row WHERE label = 'Video: part 2'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Video strip', (SELECT id FROM row WHERE label = 'Video: part 2'), 1);


insert into task(my_order, label, row_id, col_id) values (
  1, 'Fix RSS titles', (SELECT id FROM row WHERE label = 'More maintenance'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Monitor mobile articles', (SELECT id FROM row WHERE label = 'More maintenance'), 1);


insert into task(my_order, label, row_id, col_id) values (
  1, 'Galleries', (SELECT id FROM row WHERE label = 'Images'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Enhanced cropping', (SELECT id FROM row WHERE label = 'Images'), 1);

insert into task(my_order, label, row_id, col_id) values (
  3, 'AB images #analytics', (SELECT id FROM row WHERE label = 'Images'), 1);

insert into task(my_order, label, row_id, col_id) values (
  4, 'Breaking News enhancements', (SELECT id FROM row WHERE label = 'Images'), 1);


insert into task(my_order, label, row_id, col_id) values (
  1, 'New hero widget', (SELECT id FROM row WHERE label = 'Misc'), 1);

insert into task(my_order, label, row_id, col_id) values (
  2, 'Curator', (SELECT id FROM row WHERE label = 'Misc'), 1);

insert into task(my_order, label, row_id, col_id) values (
  3, 'Newsletters', (SELECT id FROM row WHERE label = 'Misc'), 1);

insert into task(my_order, label, row_id, col_id) values (
  4, 'HTTPS', (SELECT id FROM row WHERE label = 'Misc'), 1);

insert into task(my_order, label, row_id, col_id) values (
  5, 'Sport focus: PL table, personalised team news, etc', (SELECT id FROM row WHERE label = 'Misc'), 1);

insert into task(my_order, label, row_id, col_id) values (
  6, 'Apple News', (SELECT id FROM row WHERE label = 'Misc'), 1);


insert into task(my_order, label, row_id, col_id) values (
  1, 'UGC', (SELECT id FROM row WHERE label = 'Big ideas'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Aggregation', (SELECT id FROM row WHERE label = 'Big ideas'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'Realtime messaging', (SELECT id FROM row WHERE label = 'Big ideas'), 1);

insert into task(my_order, label, row_id, col_id) values (
  1, 'PWA', (SELECT id FROM row WHERE label = 'Big ideas'), 1);
