CREATE TABLE `zenboard`.`row` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `position` int(11) NOT NULL,
  `description` LONGTEXT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `zenboard`.`card` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(512) NOT NULL,
  `row_id` INT NULL,
  `col_id` INT NULL,
  `position` INT NOT NULL,
  `description` LONGTEXT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));

insert into row (position, title) values (1, 'Example row');

insert into row (position, title) values (2, 'New requests, issues, etc');

insert into card (position, title, row_id, col_id) values (
    1, 'Example card', (SELECT id FROM row WHERE title = 'Example row'), 1);
