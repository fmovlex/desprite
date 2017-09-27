package cmd

import (
	"sync"
)

// IOGroup wraps a WaitGroup with an additional rate-limit interface.
// It is meant for a group of goroutines dealing with file ops.
type IOGroup interface {
	// Limit returns the rate limit for this IOGroup.
	Limit() int

	// Take consumes a rate token and increments the WaitGroup counter.
	// It must be returned with Done().
	Take()

	// Done returns a rate token and decrements the WaitGroup counter.
	Done()

	// Wait blocks until the WaitGroup counter is zero.
	Wait()
}

// NewIOGroup creates a best-effort IOGroup.
// Limit is determined dynamically with syscall, or falls back to a safe value.
func NewIOGroup() IOGroup {
	limit := checkLimit()

	limiter := make(chan bool, limit)
	for i := 0; i < limit; i++ {
		limiter <- true
	}

	wg := &sync.WaitGroup{}
	wg.Add(1)

	return &ioGroup{limit: limit, wg: wg, limiter: limiter}
}

type ioGroup struct {
	limit   int
	wg      *sync.WaitGroup
	limiter chan bool
	waited  bool
}

func (g *ioGroup) Limit() int {
	return g.limit
}

func (g *ioGroup) Take() {
	g.wg.Add(1)
	<-g.limiter
}

func (g *ioGroup) Done() {
	g.wg.Done()
	g.limiter <- true
}

func (g *ioGroup) Wait() {
	if !g.waited {
		g.waited = true
		g.wg.Done()
	}
	g.wg.Wait()
}
