exports.getDbConfig = function() {
	// On Heroku, JAWSDB_URL will be set automatically (if JawsDB is provisioned)
	return process.env.JAWSDB_URL || 'mysql://zenadmin:snowflake@localhost/zenboard';
}
