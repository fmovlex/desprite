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
	.alias('u', 'unique')
	.describe('u', 'Include duplicate rules if their rule identifiers are unique')
	.alias('s', 'spawn')
	.describe('s', 'Max threads spawned for split operation (default: 50)')
	.alias('r', 'ratio')
	.describe('r', 'The scale ratio between the source image size and the css sprite size (ex. 2 for retina image)')
	.argv;

	return argv;
};
