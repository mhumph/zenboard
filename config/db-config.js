exports.getDbConfig = function() {
	// var host = process.env.ZEN_DB_HOST || 'localhost';
	// var user = process.env.ZEN_DB_USER || 'zenadmin';
	// var password = process.env.ZEN_DB_PASS || 'snowflake';
	// var database = process.env.ZEN_DB_SCHEMA || 'wikiboard';

	// CLEARDB_DATABASE_URL
	return process.env.JAWSDB_URL || 'mysql://zenadmin:snowflake@localhost/wikiboard';
	// return {
	// 	'host'     : host,
	// 	'user'     : user,
	// 	'password' : password,
	// 	'database' : database
	// };
}
