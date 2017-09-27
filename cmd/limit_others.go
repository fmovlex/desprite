// +build !windows

package cmd

import "syscall"

func checkLimit() int {
	var rlimit syscall.Rlimit
	err := syscall.Getrlimit(syscall.RLIMIT_NOFILE, &rlimit)
	if err != nil {
		return 50 // true random
	}
	return int(rlimit.Cur)
}
