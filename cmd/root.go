// Copyright © 2017 fmovlex
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

// Package cmd contains the main desprite CLI.
package cmd

import (
	"fmt"
	"image"
	"io/ioutil"
	"os"
	"path/filepath"
	"time"

	"github.com/fmovlex/desprite/pkg"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

var output string
var named bool
var ratio int
var verbose bool

func init() {
	cobra.OnInitialize(func() {
		viper.AutomaticEnv()
	})

	f := RootCmd.Flags()
	f.StringVarP(&output, "output", "o", "split/", "output folder path")
	f.BoolVarP(&named, "named", "n", false, "consider identifiers when filtering duplicates")
	f.IntVarP(&ratio, "ratio", "r", 1, "scale ratio between the source image size and the CSS sprite size (ex. 2 for retina)")
	f.BoolVarP(&verbose, "verbose", "v", false, "print verbose progress messages")
}

// RootCmd is the main desprite command.
var RootCmd = &cobra.Command{
	Use:     "desprite IMAGE CSS [CSS]...",
	Example: "  desprite sprite.png first.css second.css --verbose",
	Short:   "desprite splits sprite images by CSS usage",
	Args:    cobra.MinimumNArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		run(args[0], args[1:])
	},
}

func run(spritePath string, cssPaths []string) {
	spriteFile, err := os.Open(spritePath)
	if err != nil {
		fail("error reading sprite: %v", err)
	}
	defer spriteFile.Close()

	sprite, _, err := image.Decode(spriteFile)
	if err != nil {
		fail("error decoding sprite: %v", err)
	}

	start := time.Now()

	var parts = []*pkg.Part{}
	for _, cssPath := range cssPaths {
		fname := filepath.Base(cssPath)
		logf("reading %v\n", fname)

		cssb, err := ioutil.ReadFile(cssPath)
		if err != nil {
			fail("error reading css: %v", err)
		}

		sheet, err := pkg.ParseCSS(string(cssb))
		if err != nil {
			fail("failed to parse css: %v", err)
		}

		logf("  - parsed %v rules\n", len(sheet.Rules))

		found := pkg.FindAll(sheet)

		logf("  - found %v rectangles\n", len(found))

		parts = append(parts, found...)
	}

	logf("total references: %v\n", len(parts))
	parts = pkg.Distinct(parts, named)
	logf("unique references: %v\n", len(parts))

	if ratio != 1 {
		logf("scaling rectangle by %v", ratio)
		parts, err = pkg.Scale(parts, ratio)
		if err != nil {
			fail("failed to scale to ratio: %v", err)
		}
	}

	logf("writing to [%v]...\n", output)
	err = os.MkdirAll(output, os.ModePerm)
	if err != nil {
		fail("failed to create out directory", err)
	}

	resultCh := make(chan string)

	grp := NewIOGroup()
	for _, p := range parts {
		grp.Take()
		go func(p *pkg.Part) {
			defer grp.Done()
			img, err := pkg.Crop(p, sprite)
			if err != nil {
				res := fmt.Sprintf("failed to crop rule %v: %v", p.Name, err)
				resultCh <- res
				return
			}

			err = pkg.Write(img, p.Name, output)
			if err != nil {
				res := fmt.Sprintf("failed to write rule %v: %v", p.Name, err)
				resultCh <- res
				return
			}

			res := fmt.Sprintf("wrote %v", p.Name)
			resultCh <- res
		}(p)
	}

	for i, l := 0, len(parts); i < l; i++ {
		res := <-resultCh
		logf("  - %v\n", res)
	}

	grp.Wait()

	total := time.Now().Sub(start).Round(time.Millisecond)
	logf("done in %v", total)
}

func logf(format string, a ...interface{}) {
	if verbose {
		fmt.Printf(format, a...)
	}
}

func fail(format string, a ...interface{}) {
	fmt.Printf(format, a...)
	os.Exit(1)
}
