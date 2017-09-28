package pkg

import (
	"errors"
	"fmt"
)

// UnrectableError is the type of error returned when
// a rule's declarations are not enough to determine a rect.
type UnrectableError struct {
	Missing []string
	Errors  []error
}

func newIncompleteError(missing []string, errors []error) *UnrectableError {
	return &UnrectableError{Missing: missing, Errors: errors}
}

func (e *UnrectableError) Error() string {
	if len(e.Errors) > 0 {
		return fmt.Sprintf("declarations are insufficient to determine the following: %v"+
			", encountered the following errors: %v",
			e.Missing,
			e.Errors)
	}
	return fmt.Sprintf("declarations are insufficient to determine the following: %v", e.Missing)
}

// UnknownFormatError is the type of error returned when
// a declaration's value doesn't match a "useful" format.
type UnknownFormatError struct {
	Scheme string
	Value  string
}

func newUnknownFormatError(scheme, value string) *UnknownFormatError {
	return &UnknownFormatError{Scheme: scheme, Value: value}
}

func (e *UnknownFormatError) Error() string {
	return fmt.Sprintf("unknown format for type scheme %s: %s", e.Scheme, e.Value)
}

// InvalidRatioError is the type of error returned when an image ratio is invalid (<=0).
type InvalidRatioError struct {
	Ratio int
}

func newErrInvalidratio(ratio int) *InvalidRatioError {
	return &InvalidRatioError{Ratio: ratio}
}

func (e *InvalidRatioError) Error() string {
	return fmt.Sprintf("scale ratio must be greater than 0: %v", e.Ratio)
}

// ErrNonQualified is returned when trying to extract a part from a non 'qualified' type rule.
var ErrNonQualified = errors.New("rule must be of type QualifiedRule")

// ErrOutOfBounds is returned when a rule's rectangle is not contained by the sprite.
var ErrOutOfBounds = errors.New("rule leads outside of the sprite bounds")

// ErrBadName is returned when a rule's calculated file name is empty.
var ErrBadName = errors.New("filename is empty after sanitation")
