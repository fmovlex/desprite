# Desprite

Desprite splits sprite images by looking for usages in their related CSS files.

It is most useful when sprite images are optimized (tightly packed), and automatic edge-finding tools are ineffective.

If your sprites have spaces between them (or you just don't have the CSS), I suggest giving [Alferd](https://github.com/ForkandBeard/Alferd-Spritesheet-Unpacker) a try. 

![image + css = desprites](http://i.imgur.com/Jn0xJwH.png)

[![Build Status](https://travis-ci.org/fmovlex/desprite.svg?branch=master)](https://travis-ci.org/fmovlex/desprite) [![GoDoc](https://godoc.org/github.com/fmovlex/desprite?status.svg)](https://godoc.org/github.com/fmovlex/desprite)

## Usage

`go get github.com/fmovlex/desprite` or download the desprite binary from the releases tab.

```
$ desprite
Usage:
  desprite IMAGE CSS [CSS]... [flags]

Examples:
  desprite sprite.png first.css second.css --verbose

Flags:
  -h, --help            help for desprite
  -n, --named           consider identifiers when filtering duplicates
  -o, --output string   output folder path (default "split/")
  -r, --ratio int       scale ratio between the source image size and the CSS sprite size (ex. 2 for retina) (default 1)
  -v, --verbose         print verbose progress messages
```

## History

Desprite was originally written in node.js (with a dependency on GraphicsMagick), after our team lost 500+ source images to our main sprite.

It used a basic matcher that looked for rules containing `width`, `height`, and `background` or `background-position`, and tried to extract the calculated rectangles from the input sprite image - which (suprisingly) had 100% success.

Over the last few years quite a few people found the tool helpful, so it has been rewritten in [Go](https://golang.org/) to provide an easy single file executable with no external dependencies.

The matcher is still as minimal as possible and does not take all wacky cases into consideration - contributions or feedback about your case are welcome.

If you'd still like to use the node.js version, it is available on commit c9efb2c.

## License

MIT