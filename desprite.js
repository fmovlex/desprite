var fs = require('fs');
var gm = require('gm');
var ansi = require('ansi');
var cursor = ansi(process.stdout);
var parse = require('./lib/parser');
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
			.argv;

var verifyExists = function (path) {
	if (!fs.existsSync(path)) {
		cursor.red();
		console.log('File not found: %s', path);
		cursor.reset();
		process.exit(0);
	}
};

verifyExists(argv.image);
verifyExists(argv.css);

var targetdir = (argv.output || 'split') + '/';
if (!fs.existsSync(targetdir)) {
	fs.mkdirSync(targetdir);
}

var cssData = fs.readFileSync(argv.css, { encoding: 'utf8' });
var parsed = parse.parseCss(cssData);
var rules = parsed.stylesheet.rules;

var total = rules.length;
var qualify = 0;
var disq = 0;
var erred = 0;
var done = 0;

console.log('found %d rules, starting split...', total);

var rulename;
var decs;
var rule;
var dec;

var isRuleValid = function(decs) {
	return decs.width !== undefined &&
	decs.height !== undefined &&
	decs.pos !== undefined;
};

for (var i = 0; i < rules.length; ++i) {
	rule = rules[i];
	if (rule.type === 'comment') {
		disq++;
		continue;
	}

	rulename = parse.parseRuleName(rule);
	decs = {};

	for (var j = 0; j < rule.declarations.length; ++j) {
		dec = rule.declarations[j];
		switch (dec.property) {
			case 'width':
			case 'height':
			decs[dec.property] = parse.parseDeclaration(dec);
			break;
			case 'background-position':
			decs.pos = parse.parseDeclaration(dec);
			break;
		}
	}

	if (!isRuleValid(decs)) {
		if (argv.verbose) {
			cursor.yellow();
			console.log('rule %s invalid for split, skipping...', rulename);
			cursor.reset();
		}

		disq++;
		continue;
	}

	if (argv.verbose) {
		cursor.green().write('rule ' + rulename + ' OK, splitting...').reset();
		console.log(' (%d, %d, %d, %d)', decs.width, decs.height, decs.pos.x, decs.pos.y);
	}

	qualify++;

	gm(argv.image)
	.crop(decs.width, decs.height, decs.pos.x, decs.pos.y)
	.write(targetdir + rulename + '.png', function(err) {
		if (err) {
			erred++;
			if (argv.verbose){
				cursor
				.red()
				.write('error in splitting: ' + err)
				.reset()
				.write('\n');
			}
		} else {
			done++;
		}

		if ((qualify + disq == total) && (done + erred == qualify)) {
			cursor
			.write('done with ' + qualify + ' valid rules out of ' + total + ' - ')
			.green()
			.write(done + ' successfullly split images')
			.reset()
			.write(' and ');

			if (erred > 0)
				cursor.red();

			cursor.write(erred + ' errors.')
			.reset()
			.write('\n');
		}
	});
}