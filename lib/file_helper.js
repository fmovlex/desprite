var fs = require('fs');
var ansi = require('ansi');
var cursor = ansi(process.stdout);

exports.verifySource = function (path) {
	if (!fs.existsSync(path)) {
		cursor.red();
		console.log('File not found: %s', path);
		cursor.reset();
		process.exit(0);
	}
};

exports.verifyOutput = function (path) {
	var targetdir = (path || 'split') + '/';
	if (!fs.existsSync(targetdir)) {
		fs.mkdirSync(targetdir);
	}
	return targetdir;
};