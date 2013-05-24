var fs = require('fs');
var cssparse = require('css-parse');

exports.parseCss = function(path) {
	var css = fs.readFileSync(path, { encoding: 'utf8' });
	return cssparse(css);
};

var parseNumericValue = function(value) {
	return parseInt(value, 10);
};

var parseBGPosition = function(pos) {
	var split = pos.split(' ');
	if (split.length < 2)
		return undefined;

	return {
		x: Math.abs(parseNumericValue(split[0])),
		y: Math.abs(parseNumericValue(split[1]))
	};
};

var parseBGShorthand = function(bg) {
	var split = bg.split(' ');
	for (var i = 0; i<split.length; ++i) {
		var splat = split[i];
		if (splat.indexOf('%') !== -1)
			continue;

		var par = parseInt(splat, 10);
		if (isNaN(par))
			continue;

		if (i+1 >= split.length)
			return undefined;

		return {
			x: Math.abs(par),
			y: Math.abs(parseNumericValue(split[i+1]))
		};
	}

	return undefined;
};

exports.parseDeclaration = function(dec) {
	switch (dec.property) {
		case 'width':
		case 'height':
		return parseNumericValue(dec.value);
		case 'background-position':
		return parseBGPosition(dec.value);
		case 'background':
		return parseBGShorthand(dec.value);
		default:
		return undefined;
	}
};

exports.parseRuleName = function(rule) {
	var selector = rule.selectors[0];
	if (selector.indexOf('.') === 0 ||
		selector.indexOf('#') === 0) {
		selector = selector.substr(1);
	}

	return selector;
};