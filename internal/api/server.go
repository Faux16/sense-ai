package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"senseai/internal/storage"
	"senseai/internal/ui"

	"github.com/gin-gonic/gin"
)

type Server struct {
	store     *storage.Store
	subs      map[chan storage.Finding]struct{}
	subsMutex sync.RWMutex
}

func NewServer(store *storage.Store) *Server {
	return &Server{
		store: store,
		subs:  make(map[chan storage.Finding]struct{}),
	}
}

func (s *Server) Broadcast(f storage.Finding) {
	s.subsMutex.RLock()
	defer s.subsMutex.RUnlock()
	for ch := range s.subs {
		select {
		case ch <- f:
		default:
		}
	}
}

func (s *Server) subscribe() chan storage.Finding {
	ch := make(chan storage.Finding, 10)
	s.subsMutex.Lock()
	s.subs[ch] = struct{}{}
	s.subsMutex.Unlock()
	return ch
}

func (s *Server) unsubscribe(ch chan storage.Finding) {
	s.subsMutex.Lock()
	delete(s.subs, ch)
	close(ch)
	s.subsMutex.Unlock()
}

func (s *Server) Start(port string) error {
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Next()
	})

	// API Routes
	r.GET("/findings", func(c *gin.Context) {
		findings, err := s.store.GetFindings()
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, findings)
	})

	r.GET("/stream", func(c *gin.Context) {
		c.Writer.Header().Set("Content-Type", "text/event-stream")
		c.Writer.Header().Set("Cache-Control", "no-cache")
		c.Writer.Header().Set("Connection", "keep-alive")

		ch := s.subscribe()
		defer s.unsubscribe(ch)

		// Send a ping to keep connection alive or initial data
		c.SSEvent("connected", "true")
		c.Writer.Flush()

		// Use request context instead of deprecated CloseNotify
		ctx := c.Request.Context()

		for {
			select {
			case f := <-ch:
				data, _ := json.Marshal(f)
				c.SSEvent("finding", string(data))
				c.Writer.Flush()
			case <-ctx.Done():
				return
			}
		}
	})

	// Static UI
	r.StaticFS("/ui", ui.GetFileSystem())
	r.GET("/", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/ui/")
	})

	fmt.Printf("Server running at http://localhost:%s\n", port)
	return r.Run(":" + port)
}
