#desprite#

Split a sprite image by the CSS usage with a simple command-line tool, written in node.

![Super important graphic](http://i.imgur.com/q7jQ6qO.png)

desprite searches your CSS for qualified<sup>1</sup> rules, and crops out the rectangles they reference to seperate<sup>2</sup> image files.
<br><br>
<sub>1 - rules containing `width`, `height`, and `background` or `background-position`.</sub><br>
<sub>2 - files are named by the rule that referenced their position (usually a class name).</sub>

##Usage##

1. desprite runs on [Node.js](http://nodejs.org/), so you need that.
2. You must also install [GraphicsMagick](http://www.graphicsmagick.org/) - that's how we crop out the images.
  * Windows: [SourceForge downloads](http://sourceforge.net/projects/graphicsmagick/files/graphicsmagick-binaries/)
  * Linux: `$ sudo apt-get install graphicsmagick`
  * Mac:
      * Homebrew: `$ brew install graphicsmagick`
      * Old fashioned: http://mac-dev-env.patrickbougie.com/graphicsmagick/

  Make sure that after your installation, your cmd/terminal responds to "gm" with the GraphicsMagick CLI.
3. That's it. Just git clone (or download zip) and run (for example):
    ```
    $ npm install
    $ node desprite.js -i sprite.png -c sprites.css --verbose
    ```
  
##Dependencies##

+ gm (https://github.com/aheckmann/gm)
+ GraphicsMagick (http://www.graphicsmagick.org/)
+ css-parse (https://npmjs.org/package/css-parse)
+ optimist (https://github.com/substack/node-optimist)
+ ansi (https://github.com/TooTallNate/ansi.js)
+ when (https://github.com/cujojs/when)

##Acknowledgments##

desprite was authored minimally to solve a problem with our team's project, and probably does not take all wacky cases into consideration.
Contributions or feedback about your case are welcome.
