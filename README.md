#desprite#

Split a sprite image by the css usage with a simple CLI written in node.

Authored minimally with our project in mind - take a look at the code before going wild.

Basically, uses CSS rules with width, height, and background-position properties to crop out images out of the sprite by your usage.
  
##Dependencies##

+ gm (https://github.com/aheckmann/gm)
+ GraphicsMagick (http://www.graphicsmagick.org/)
+ css-parse (https://npmjs.org/package/css-parse)
+ optimist (https://github.com/substack/node-optimist)
+ ansi (https://github.com/TooTallNate/ansi.js)

##Usage##

You must first install [GraphicsMagick](http://www.graphicsmagick.org/) - the gm module requires it to crop out the images.

Then just git clone and run (for example):

    $ npm install
    $ node desprite.js -i sprite.png -c sprites.css --verbose