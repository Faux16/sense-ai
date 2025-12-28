package gateway

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"time"

	"senseai/internal/policy"
	"senseai/internal/storage"
)

type Gateway struct {
	Config *Config
	Engine *policy.Engine
	Store  *storage.Store
}

func NewGateway(cfg *Config, engine *policy.Engine, store *storage.Store) *Gateway {
	return &Gateway{
		Config: cfg,
		Engine: engine,
		Store:  store,
	}
}

func (g *Gateway) Start() error {
	mux := http.NewServeMux()

	for _, route := range g.Config.Routes {
		targetURL, err := url.Parse(route.Target)
		if err != nil {
			return fmt.Errorf("invalid target URL for route %s: %w", route.Path, err)
		}

		proxy := httputil.NewSingleHostReverseProxy(targetURL)

		// Custom Director to handle path rewriting if needed, or Auth headers
		originalDirector := proxy.Director
		proxy.Director = func(req *http.Request) {
			originalDirector(req)
			// Reset Host header to target's host (important for cloud CLIs)
			req.Host = targetURL.Host

			// Start timing/logging here (Middleware later)
			log.Printf("[Gateway OUT] %s -> %s%s", req.RemoteAddr, route.Target, req.URL.Path)
		}

		// Simple Error Handler
		proxy.ErrorHandler = func(w http.ResponseWriter, r *http.Request, err error) {
			log.Printf("Proxy Error: %v", err)
			http.Error(w, "Bad Gateway: "+err.Error(), http.StatusBadGateway)
		}

		// Wrap proxy with Middleware
		handler := g.InspectionMiddleware(proxy)
		mux.Handle(route.Path, handler)
		fmt.Printf("Registered Route: %s -> %s (Provider: %s)\n", route.Path, route.Target, route.Provider)
	}

	// Catch-all for basic health check
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("SenseAI Gateway Operational"))
	})

	addr := fmt.Sprintf(":%d", g.Config.Server.Port)
	fmt.Printf("SenseAI Gateway listening on %s\n", addr)

	server := &http.Server{
		Addr:         addr,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
	}

	return server.ListenAndServe()
}

func (g *Gateway) InspectionMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Only inspect POST/PUT requests with bodies
		if r.Method == http.MethodPost || r.Method == http.MethodPut {
			// Read body
			bodyBytes, err := io.ReadAll(r.Body)
			if err != nil {
				log.Printf("Failed to read body: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
				return
			}
			// Restore proper body for the proxy to use later
			r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

			// Parse JSON
			var data map[string]interface{}
			if err := json.Unmarshal(bodyBytes, &data); err != nil {
				// Not JSON? Maybe skip inspection or log error
				// For now, proceed (pass-through non-JSON)
				next.ServeHTTP(w, r)
				return
			}

			// Evaluate Policy
			if rule := g.Engine.EvaluateJSON(data); rule != nil {
				log.Printf("[POLICY MATCH] %s (Action: %s)", rule.Name, rule.Action)

				// Log finding
				finding := storage.Finding{
					Type:      "gateway",
					Details:   fmt.Sprintf("Gateway Policy Violation: %s", rule.Name),
					Source:    string(bodyBytes), // Caution: PII?
					Timestamp: time.Now(),
					Severity:  rule.Severity,
				}
				g.Store.LogFinding(finding)

				if rule.Action == policy.ActionBlock {
					http.Error(w, fmt.Sprintf("Blocked by SenseAI Policy: %s", rule.Name), http.StatusForbidden)
					return
				}
			}
		}

		next.ServeHTTP(w, r)
	})
}
