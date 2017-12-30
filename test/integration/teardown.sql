DELETE FROM card WHERE row_id = (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration');

DELETE FROM row WHERE title = '0F65u28Rc66ORYII integration';


DELETE FROM card WHERE row_id = (SELECT id FROM row WHERE title = '0F65u28Rc66ORYII integration row B');

DELETE FROM row WHERE title = '0F65u28Rc66ORYII integration row B';
