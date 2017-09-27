package pkg

import (
	"image"
	"strconv"
	"strings"

	"github.com/chris-ramon/douceur/css"
)

// Part is a named rectangle inside a sprite.
// It is a sub-image "guess" based on a rectangle-fitting CSS rule.
type Part struct {
	Name string
	Rect *image.Rectangle
}

// FindAll calls Find for every rule in the stylesheet.
// It returns all extracted Parts and ignores all errors.
func FindAll(sheet *css.Stylesheet) []*Part {
	parts := []*Part{}
	for _, rule := range sheet.Rules {
		part, err := Find(rule)
		if err != nil {
			continue
		}
		parts = append(parts, part)
	}
	return parts
}

// Find inspects a CSS rule for all properties that usually point to a sprite (width, height, background position).
// It returns a sprite "Part" or any error making the rule ineligable.
func Find(rule *css.Rule) (*Part, error) {
	// only qualified rules are inspected, @at rules are ignored
	if rule.Kind != css.QualifiedRule {
		return nil, ErrNonQualified
	}

	// empty rules are given a shortcut
	if len(rule.Declarations) == 0 {
		return nil, newIncompleteError(required)
	}

	// collect properties-of-interest, or any errors extracting them
	m := make(map[string]int)
	errs := []error{}
	put := func(k string, v int, err error) {
		if err != nil {
			errs = append(errs, err)
		} else {
			m[k] = v
		}
	}

	for _, d := range rule.Declarations {
		switch d.Property {
		case "width":
			num, err := atoi(d.Value)
			put("w", num, err)
		case "height":
			num, err := atoi(d.Value)
			put("h", num, err)
		case "background":
			x, y, err := bgshort(d.Value)
			put("x", x, err)
			put("y", y, err)
		case "background-position":
			x, y, err := bgpos(d.Value)
			put("x", x, err)
			put("y", y, err)
		}
	}

	// check that the map contains a full rectangle representation
	err := checkRequired(m)
	if err != nil {
		return nil, err
	}

	// sub images are named by their first selector
	name := rule.Selectors[0].Value

	// create a sprite "part"
	x, y, w, h := m["x"], m["y"], m["w"], m["h"]
	rect := image.Rect(x, y, x+w, y+h)
	return &Part{Name: name, Rect: &rect}, nil
}

func atoi(str string) (int, error) {
	// accept "100"/"100px" for measuremeants.
	// the unit for "100" is technically unknown, but most browsers will treat it as px.
	unpixed := strings.TrimRight(str, "px")
	return strconv.Atoi(unpixed)
}

func bgshort(str string) (int, int, error) {
	// background property's shorthand format is very flexible,
	// this extraction method is meant to deal with common sprite generator output,
	// which usually looks like "background: url("sprite.png") -80px -50px ..."
	split := strings.Split(str, " ")
	for i, l := 0, len(split)-1; i < l; i++ {
		x, err := atoi(split[i])
		if err != nil {
			continue
		}
		y, err := atoi(split[i+1])
		if err != nil {
			continue
		}
		// results are reverse-signed as they signify the "image 0 offset" in the context of css
		return -x, -y, nil
	}

	return 0, 0, newUnknownFormatError("bg-short", str)
}

func bgpos(str string) (int, int, error) {
	// the background-position property format is very flexible,
	// this extraction method is meant to deal with common sprite generator output,
	// which usually looks like "background-position: -80px -50px"
	split := strings.Split(str, " ")
	if len(split) < 2 {
		return 0, 0, newUnknownFormatError("bg-pos", str)
	}

	x, err := atoi(split[0])
	if err != nil {
		return 0, 0, err
	}

	y, err := atoi(split[1])
	if err != nil {
		return 0, 0, err
	}

	// results are reverse-signed as they signify the "image 0 offset" in the context of css
	return -x, -y, nil
}

var required = []string{"x", "y", "w", "h"}

func checkRequired(m map[string]int) error {
	missing := []string{}
	for _, prop := range required {
		if _, ok := m[prop]; !ok {
			missing = append(missing, prop)
		}
	}

	if len(missing) > 0 {
		// could not determine one or more of the required rectangle properties
		return newIncompleteError(missing)
	}

	return nil
}
