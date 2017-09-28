package pkg

import (
	"fmt"
	"image"
	"image/png"
	"os"
	"path/filepath"

	"github.com/chris-ramon/douceur/css"
	"github.com/chris-ramon/douceur/parser"
	"github.com/disintegration/gift"
	"github.com/kennygrant/sanitize"
	"github.com/pkg/errors"
)

// ParseCSS parses a CSS string.
// It returns the parsed stylesheet or any errors encountered.
func ParseCSS(cssText string) (*css.Stylesheet, error) {
	sheet, err := parser.Parse(cssText)
	if err != nil {
		return nil, errors.Wrap(err, "error parsing css")
	}
	return sheet, nil
}

// Scale scales an array of Parts by a positive int ratio.
// It turns a rectangle of (x, y, x+w, y+h) to (x, y, x+rw, y+rh).
func Scale(parts []*Part, ratio int) ([]*Part, error) {
	if ratio <= 0 {
		return nil, newErrInvalidratio(ratio)
	}

	scaled := []*Part{}
	for _, p := range parts {
		x, y := p.Rect.Min.X, p.Rect.Min.Y
		diff := p.Rect.Max.Sub(p.Rect.Min)
		w, h := diff.X, diff.Y
		sr := image.Rect(x, y, x+(ratio*w), y+(ratio*h))
		sp := &Part{Name: p.Name, Rect: &sr}
		scaled = append(scaled, sp)
	}
	return scaled, nil
}

// Distinct filters duplicate rectangles from an array of Parts (last entry wins).
// If consinderName is true, the Part's name is also considered in the comparison (allowing duplicate rects).
func Distinct(parts []*Part, considerName bool) []*Part {
	// pick a key function
	keyFunc := keyRect
	if considerName {
		keyFunc = keyNamed
	}

	m := make(map[string]*Part)
	for _, p := range parts {
		k := keyFunc(p)
		m[k] = p
	}

	distinct := []*Part{}
	for _, p := range m {
		distinct = append(distinct, p)
	}
	return distinct
}

func keyNamed(p *Part) string {
	return fmt.Sprintf("%v.%v.%v.%v.%v", p.Name, p.Rect.Min.X, p.Rect.Min.Y, p.Rect.Max.X, p.Rect.Max.Y)
}

func keyRect(p *Part) string {
	return fmt.Sprintf("%v.%v.%v.%v", p.Rect.Min.X, p.Rect.Min.Y, p.Rect.Max.X, p.Rect.Max.Y)
}

// Crop crops a Part's rect out of an image.
// If the Part's rect is out of the image bounds, an error is returned.
func Crop(part *Part, sprite image.Image) (image.Image, error) {
	if !part.Rect.In(sprite.Bounds()) {
		return nil, ErrOutOfBounds
	}

	img := image.NewRGBA(*part.Rect)
	g := gift.New(gift.Crop(*part.Rect))
	g.Draw(img, sprite)
	return img, nil
}

// Write encodes an image to PNG and writes to disk with a sanitized filename.
func Write(img image.Image, name string, path string) error {
	fname, err := filename(name)
	if err != nil {
		return err
	}

	fullPath := filepath.Join(path, fname)
	f, err := os.Create(fullPath)
	if err != nil {
		return errors.Wrap(err, "failed to create image file")
	}
	defer f.Close()

	err = png.Encode(f, img)
	if err != nil {
		return errors.Wrap(err, "failed to encode image")
	}

	return nil
}

func filename(s string) (string, error) {
	sname := sanitize.Path(s)
	if sname == "" || sname == "." {
		return "", ErrBadName
	}
	if sname[0] == '.' {
		sname = sname[1:]
	}
	return sname + ".png", nil
}
