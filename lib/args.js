module.exports = function () {
	var argv = require('optimist')
	.usage('Split a sprite image by the css usage.\nUsage: $0')
	.demand('i')
	.alias('i', 'image')
	.describe('i', 'Sprite image')
	.demand('c')
	.alias('c', 'css')
	.describe('c', 'CSS file')
	.alias('o', 'output')
	.describe('o', 'Output folder path (default: split/)')
	.alias('v', 'verbose')
	.describe('v', 'Verbose progress messages')
	.alias('p', 'parsed')
	.describe('p', 'Verbose progress messages shown for valid rules only')
	.argv;

	return argv;
};