CREATE TABLE `zenboard`.`row` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `label` varchar(255) NOT NULL,
  `my_order` int(11) NOT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  `info` VARCHAR(512) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `zenboard`.`task` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `label` VARCHAR(512) NOT NULL,
  `row_id` INT NULL,
  `col_id` INT NULL,
  `my_order` INT NOT NULL,
  `description` LONGTEXT NULL,
  `is_archived` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `id_UNIQUE` (`id` ASC));

insert into row (my_order, label) values (1, 'Example row');

insert into task(my_order, label, row_id, col_id) values (
    1, 'Example card', (SELECT id FROM row WHERE label = 'Example row'), 1);
