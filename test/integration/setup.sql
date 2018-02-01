-- Basic test data: a row with 2 columns, 3 cards in each column
-- Test data has a specific title so that it can be deleted safely afterwards

INSERT INTO row (position, title) VALUES (123456, '0F65u28Rc66ORYII integration');

-- Col 1

INSERT INTO card (position, title, row_id, col_id) VALUES (
  1, '0F65u28Rc66ORYII card 1,1', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 1);

INSERT INTO card (position, title, row_id, col_id) VALUES (
  2, '0F65u28Rc66ORYII card 1,2', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 1);

INSERT INTO card (position, title, row_id, col_id) VALUES (
  3, '0F65u28Rc66ORYII card 1,3', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 1);

-- Col 2

INSERT INTO card (position, title, row_id, col_id) VALUES (
  1, '0F65u28Rc66ORYII card 2,1', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 2);

INSERT INTO card (position, title, row_id, col_id) VALUES (
  2, '0F65u28Rc66ORYII card 2,2', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 2);

INSERT INTO card (position, title, row_id, col_id) VALUES (
  3, '0F65u28Rc66ORYII card 2,3', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 2);

-- Col 4

INSERT INTO card (position, title, row_id, col_id) VALUES (
  1, '0F65u28Rc66ORYII card 4,1', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration'), 4);


-- Another row, with three cards in the first column

INSERT INTO row (position, title) VALUES (123457, '0F65u28Rc66ORYII integration row B');


INSERT INTO card (position, title, row_id, col_id) VALUES (
  1, '0F65u28Rc66ORYII card b1,1', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration row B'), 1);

INSERT INTO card (position, title, row_id, col_id) VALUES (
  2, '0F65u28Rc66ORYII card b1,2', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration row B'), 1);

INSERT INTO card (position, title, row_id, col_id) VALUES (
  3, '0F65u28Rc66ORYII card b1,3', (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration row B'), 1);
