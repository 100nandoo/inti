package textprocessing

import "errors"

func IsTTSUnavailable(err error) bool {
	return errors.Is(err, ErrTTSUnavailable)
}
