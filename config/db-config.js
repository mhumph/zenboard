exports.getDbConfig = function() {
	return process.env.JAWSDB_URL || 'mysql://zenadmin:snowflake@localhost/zenboard';
}
