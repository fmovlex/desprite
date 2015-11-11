#!/usr/bin/env node

var fs = require('fs');
var gm = require('gm');
var when = require('when');

var ansi = require('ansi');
var cursor = ansi(process.stdout);
var args = require('./lib/args');

var parser = require('./lib/parser');
var sanitize = require('sanitize-filename');

var argv = args();

var log = {
	valid: argv.verbose || argv.parsed,
	invalid: argv.verbose && !argv.parsed
};

var chunkSize = argv.spawn || 50;
var chunk = 0;
var counter = {
	err: 0,
	ok: 0
};

var uniqueNames = argv.unique || false;

main();

function main() {
	verifySourceFile(argv.image);
	verifySourceFile(argv.css);
	argv.output = resolveOutputPath(argv.output);
	argv.ratio = resolveRatio(argv.ratio);

	var parsed = parser.parseCss(argv.css);
	var rules = parsed.stylesheet.rules;
	console.log('found %d css entries, parsing...', rules.length);

	var valids = validate(rules);
	console.log('parsed %d valid rules out of a total %d, starting split...',
		valids.length, rules.length);

	processNextChunk(valids);
}

function processNextChunk(valids) {
	var slice = valids.slice(chunk*chunkSize, (chunk+1)*chunkSize);
	if (!slice.length) {
		logResult();
		return;
	}

	var promises = queue(slice);
	when.all(promises)
		.then(function() {
			if (log.valid) logChunk(chunk);
			++chunk;
			processNextChunk(valids);
		});
}

function validate(rules) {
	var valids = {};

	rules.forEach(function(rule) {
		if (rule.type !== 'rule') return;
		if (!rule.declarations) return;

		var name = parser.parseRuleName(rule);
		var decs = {};

		rule.declarations.forEach(function(dec) {
			switch(dec.property) {
				case 'width':
				case 'height':
					decs[dec.property] = parser.parseDimension(dec.value);
					break;
				case 'background':
					decs.pos = parser.parseBGShorthand(dec.value);
					break;
				case 'background-position':
					decs.pos = parser.parseBGPosition(dec.value);
					break;
			}
		});

		if (isRuleValid(decs)) {
			var key = (uniqueNames)
						 ? [name, decs.width, decs.height, decs.pos.x, decs.pos.y].join('_')
						 : [decs.width, decs.height, decs.pos.x, decs.pos.y].join('_');
			if (valids[key]) {
				if (log.invalid) logDuplicate(name, valids[key].name);
			} else {
				valids[key] = {name: name, decs: decs}
				if (log.valid) logValid(name, decs);
			}
		} else {
			if (log.invalid) logInvalid(name);
		}
	});

	// extract values
	return Object.keys(valids).map(function (key) {return valids[key]});
}

function queue(valids) {
	var promises = [];

	valids.forEach(function(valid) {
		var dfd = when.defer();
		promises.push(dfd.promise);

		var sanitized = sanitize(valid.name);
		var target = argv.output + sanitized + '.png';
		split(valid.decs, target, dfd);
	});

	return promises;
}

function split(decs, target, dfd) {
	gm(argv.image)
		.crop(decs.width * argv.ratio, decs.height * argv.ratio, decs.pos.x * argv.ratio, decs.pos.y * argv.ratio)
		.write(target, function(err) {
			if (err) {
				counter.err++;
				if (log.valid) logSplitError(err);
			} else {
				counter.ok++;
			}

			dfd.resolve();
		});
}

function verifySourceFile(path) {
	if (!fs.existsSync(path)) {
		cursor.red();
		console.log('File not found: %s', path);
		cursor.reset();
		process.exit(0);
	}
}

function resolveOutputPath(userArg) {
	var targetdir = (userArg || 'split') + '/';
	if (!fs.existsSync(targetdir)) {
		fs.mkdirSync(targetdir);
	}

	return targetdir;
}

function isRuleValid(decs) {
	return decs.width !== undefined &&
	decs.height !== undefined &&
	decs.pos !== undefined;
}

function logValid(name, decs) {
	cursor.green().write('rule ' + name + ' OK, saved for split...').reset();
	console.log(' (%d, %d, %d, %d)', decs.width, decs.height, decs.pos.x, decs.pos.y);
}

function logDuplicate(name1, name2) {
	cursor.yellow();
	console.log('rule %s is a duplicate of rule %s, skipping...', name1, name2);
	cursor.reset();
}

function logInvalid(name) {
	cursor.yellow();
	console.log('rule %s invalid for split, skipping...', name);
	cursor.reset();
}

function logSplitError(err) {
	cursor
		.red()
		.write('error while splitting: ' + err)
		.reset()
		.write('\n');
}

function logChunk(chunk) {
	cursor
		.green()
		.write('processed chunk ' + (chunk+1))
		.reset()
		.write('\n');
}

function logResult() {
	cursor
		.write('all done! ')
		.green()
		.write(counter.ok + ' successfully split images')
		.reset()
		.write(' and ');

	if (counter.err > 0)
		cursor.red();

	cursor
		.write(counter.err + ' errors.')
		.reset()
		.write('\n');
}

function resolveRatio(ratio) {
	if (!ratio) return 1;

	if (isNaN(ratio) || parseFloat(ratio) <= 0) {
		cursor.red();
		console.log('Invalid scale ratio: %s', ratio);
		cursor.reset();
		process.exit(0);
	}

	return parseFloat(ratio);
}
