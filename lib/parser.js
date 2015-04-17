var fs = require('fs');
var cssparse = require('css-parse');

function num(str) { return parseInt(str, 10); }

var parser = {
	parseCss: function(path) {
		var css = fs.readFileSync(path, { encoding: 'utf8' });
		return cssparse(css);
	},

	parseDimension: function(value) {
		return num(value);
	},

	parseBGPosition: function(pos) {
		var split = pos.split(' ');
		if (split.length < 2)
			return undefined;

		return {
			x: Math.abs(num(split[0])),
			y: Math.abs(num(split[1]))
		};
	},

	parseBGShorthand: function(bg) {
		var split = bg.split(' ');

		for (var i = 0, l1 = split.length - 1; i<l1; ++i) {
			var splat = split[i];
			if (splat.indexOf('%') !== -1) continue;

			var maybeX = num(splat);
			if (isNaN(maybeX)) continue;

			var hopefullyY = num(split[i+1]);

			return {
				x: Math.abs(maybeX),
				y: Math.abs(hopefullyY)
			};
		}

		return undefined;
	},

	parseRuleName: function(rule) {
		var selector = rule.selectors[0];
		if (/^[\.|#]/.test(selector))
			selector = selector.substr(1);

		return selector;
	}
};

module.exports = parser;
