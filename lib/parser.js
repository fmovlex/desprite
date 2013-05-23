var _ = require('underscore');
var cssparse = require('css-parse');

exports.parseCss = function(css) {
	return cssparse(css);
};

var parseNumericValue = function(value) {
	return parseInt(value, 10);
};

var parseBGPosition = function(pos) {
	var split = pos.split(' ');
	return {
		x: Math.abs(parseNumericValue(split[0])),
		y: Math.abs(parseNumericValue(split[1]))
	};
};

exports.parseDeclaration = function(dec) {
	switch (dec.property) {
		case 'width':
		case 'height':
			return parseNumericValue(dec.value);
		case 'background-position':
			return parseBGPosition(dec.value);
		default:
			return undefined;
	}
};

exports.parseRuleName = function(rule) {
	var selector = rule.selectors[0];
	if (selector.indexOf('.') === 0) {
		selector = selector.substr(1);
	}

	return selector;
};