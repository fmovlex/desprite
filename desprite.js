var gm = require('gm');
var ansi = require('ansi');
var when = require('when');
var cursor = ansi(process.stdout);

var argv = require('./lib/args')();
var parser = require('./lib/parser');
var files = require('./lib/file_helper');

files.verifySource(argv.image);
files.verifySource(argv.css);
var targetdir = files.verifyOutput(argv.output);

var parsed = parser.parseCss(argv.css);
var rules = parsed.stylesheet.rules;

console.log('found %d css entries, parsing...', rules.length);

var isRuleValid = function(decs) {
	return decs.width !== undefined &&
	decs.height !== undefined &&
	decs.pos !== undefined;
};

var qualifiers = [];

for (var i = 0; i < rules.length; ++i) {
	var rule = rules[i];

	if (rule.type !== 'rule' || !rule.declarations)
		continue;

	var rulename = parser.parseRuleName(rule);
	var decs = {};

	for (var j = 0; j < rule.declarations.length; ++j) {
		var dec = rule.declarations[j];
		switch (dec.property) {
			case 'width':
			case 'height':
			decs[dec.property] = parser.parseDeclaration(dec);
			break;
			case 'background-position':
			case 'background':
			decs.pos = parser.parseDeclaration(dec);
			break;
		}
	}

	if (!isRuleValid(decs)) {
		if (argv.verbose && !argv.parsed) {
			cursor.yellow();
			console.log('rule %s invalid for split, skipping...', rulename);
			cursor.reset();
		}

		continue;
	}

	if (argv.verbose || argv.parsed) {
		cursor.green().write('rule ' + rulename + ' OK, saved for split...').reset();
		console.log(' (%d, %d, %d, %d)', decs.width, decs.height, decs.pos.x, decs.pos.y);
	}

	qualifiers.push({ name: rulename, decs: decs });
}

var qualified = qualifiers.length;
console.log('parsed %d valid rules out a total %d, starting split...', qualified, rules.length);

var promises = [];
var erred = 0;
var done = 0;

var doSplit = function (image, decs, target, log, dfd) {
	gm(image)
	.crop(decs.width, decs.height, decs.pos.x, decs.pos.y)
	.write(target, function(err) {
		if (err) {
			erred++;
			if (log) {
				cursor
				.red()
				.write('error while splitting: ' + err)
				.reset()
				.write('\n');
			}
		} else {
			done++;
		}

		dfd.resolve();
	});
};

var log = argv.verbose || argv.parsed;

for (var i = 0; i<qualified; ++i) {
	var dfd = when.defer();
	promises.push(dfd.promise);

	var qualifier = qualifiers[i];
	doSplit(argv.image, qualifier.decs,
		targetdir + qualifier.name + '.png', log, dfd);
}

when.all(promises).then(function() {
	cursor
	.write('all done! ')
	.green()
	.write(done + ' successfully split images')
	.reset()
	.write(' and ');

	if (erred > 0)
		cursor.red();

	cursor.write(erred + ' errors.')
	.reset()
	.write('\n');
});