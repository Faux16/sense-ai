package main

import (
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"senseai/internal/action"
	"senseai/internal/api"
	"senseai/internal/detector"
	"senseai/internal/policy"
	"senseai/internal/storage"

	"github.com/spf13/cobra"
)

var (
	iface      string
	port       string
	policyFile string
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "sense",
		Short: "Shadow AI Surveillance Tool",
		Run:   runSense,
	}

	rootCmd.Flags().StringVarP(&iface, "interface", "i", "en0", "Network interface to scan")
	rootCmd.Flags().StringVarP(&port, "port", "p", "8080", "Port to run the web interface")
	rootCmd.Flags().StringVarP(&policyFile, "policies", "c", "policies.yaml", "Path to policies file")
	var dbPath string
	rootCmd.Flags().StringVarP(&dbPath, "db", "d", "sense.db", "Path to database file")

	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func runSense(cmd *cobra.Command, args []string) {
	dbPath, _ := cmd.Flags().GetString("db")
	// 1. Initialize Storage
	store, err := storage.NewStore(dbPath)
	if err != nil {
		fmt.Printf("Failed to initialize database: %v\n", err)
		os.Exit(1)
	}
	defer store.Close()

	// 2. Load Policy Engine
	engine, err := policy.NewEngine(policyFile)
	if err != nil {
		fmt.Printf("Failed to load policies: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("Loaded %d policies from %s\n", len(engine.Rules), policyFile)

	// 3. Initialize Remediator
	remediator := action.NewRemediator(false) // Set to true for dry-run mode

	// 4. Initialize API Server
	server := api.NewServer(store)

	// 5. Define Finding Handler
	handler := func(typ, details, source string, sev float64, rule *policy.Rule) {
		// Store finding
		f := storage.Finding{
			Type:      typ,
			Details:   details,
			Source:    source,
			Timestamp: time.Now(),
			Severity:  sev,
		}

		// Add policy info to source if matched
		if rule != nil {
			var sourceMeta map[string]interface{}
			if err := json.Unmarshal([]byte(source), &sourceMeta); err == nil {
				sourceMeta["policy_action"] = string(rule.Action)
				if newSource, err := json.Marshal(sourceMeta); err == nil {
					f.Source = string(newSource)
				}
			}

			// Execute remediation based on policy action
			switch rule.Action {
			case policy.ActionBlock:
				// Extract IP from source metadata for network findings
				var meta map[string]interface{}
				if json.Unmarshal([]byte(source), &meta) == nil {
					if dstIP, ok := meta["dst_ip"].(string); ok && dstIP != "" {
						fmt.Printf("[ACTION] Blocking IP: %s (Policy: %s)\n", dstIP, rule.Name)
						if err := remediator.BlockIP(dstIP); err != nil {
							fmt.Printf("[ERROR] Failed to block IP: %v\n", err)
						}
					}
				}
			case policy.ActionKill:
				// Extract PID from source metadata for endpoint findings
				var meta map[string]interface{}
				if json.Unmarshal([]byte(source), &meta) == nil {
					if pidFloat, ok := meta["pid"].(float64); ok {
						pid := int32(pidFloat)
						fmt.Printf("[ACTION] Killing process PID: %d (Policy: %s)\n", pid, rule.Name)
						if err := remediator.KillProcess(pid); err != nil {
							fmt.Printf("[ERROR] Failed to kill process: %v\n", err)
						}
					}
				}
			case policy.ActionAlert:
				// Alert action: only log the finding (no remediation needed)
				fmt.Printf("[ALERT] %s - %s (Policy: %s, Severity: %.2f)\n", typ, details, rule.Name, sev)
			default:
				// Unknown action type - log for debugging
				fmt.Printf("[WARN] Unknown policy action '%s' for rule: %s\n", rule.Action, rule.Name)
			}
		}

		// Log to DB
		if err := store.LogFinding(f); err != nil {
			fmt.Printf("Error logging finding: %v\n", err)
		}
		// Broadcast to UI
		server.Broadcast(f)
	}

	// 6. Start Detectors
	// Network
	netDetector := detector.NewNetworkDetector(iface, engine, handler)
	go func() {
		if err := netDetector.Start(24 * time.Hour); err != nil {
			fmt.Printf("Network detector error: %v\n", err)
		}
	}()

	// Endpoint
	endDetector := detector.NewEndpointDetector(engine, handler)
	go endDetector.Start(10 * time.Second)

	// 7. Start API Server
	// Handle graceful shutdown
	go func() {
		if err := server.Start(port); err != nil {
			fmt.Printf("Server error: %v\n", err)
		}
	}()

	// Wait for interrupt
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	fmt.Println("Shutting down SENSE...")
}
