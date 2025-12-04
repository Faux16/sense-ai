package detector

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"senseai/internal/policy"

	"github.com/shirou/gopsutil/v3/process"
)

type EndpointDetector struct {
	handler func(string, string, string, float64, *policy.Rule)
	engine  *policy.Engine
}

func NewEndpointDetector(engine *policy.Engine, handler func(string, string, string, float64, *policy.Rule)) *EndpointDetector {
	return &EndpointDetector{
		handler: handler,
		engine:  engine,
	}
}

func (d *EndpointDetector) Start(interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	for range ticker.C {
		d.scanProcesses()
	}
}

func (d *EndpointDetector) scanProcesses() {
	procs, err := process.Processes()
	if err != nil {
		return
	}

	for _, p := range procs {
		name, err := p.Name()
		if err != nil {
			continue
		}
		cmdline, err := p.Cmdline()
		if err != nil {
			continue
		}

		name = strings.ToLower(name)
		cmdline = strings.ToLower(cmdline)

		// Evaluate against policies
		rule := d.engine.Evaluate("endpoint", name+" "+cmdline)
		if rule != nil {
			// Gather rich metadata
			meta := map[string]interface{}{
				"pid":          p.Pid,
				"name":         name,
				"cmdline":      cmdline,
				"matched_rule": rule.Name,
			}
			if parent, err := p.Parent(); err == nil {
				if pname, err := parent.Name(); err == nil {
					meta["parent_name"] = pname
					meta["parent_pid"] = parent.Pid
				}
			}
			if user, err := p.Username(); err == nil {
				meta["user"] = user
			}

			sourceJSON, _ := json.Marshal(meta)
			details := fmt.Sprintf("Process: %s\nPID: %d\n(Rule: %s)", name, p.Pid, rule.Name)
			d.handler("endpoint", details, string(sourceJSON), rule.Severity, rule)
		} else if isAIProcess(name, cmdline) {
			// Fallback to legacy detection
			meta := map[string]interface{}{
				"pid":     p.Pid,
				"name":    name,
				"cmdline": cmdline,
			}
			if parent, err := p.Parent(); err == nil {
				if pname, err := parent.Name(); err == nil {
					meta["parent_name"] = pname
					meta["parent_pid"] = parent.Pid
				}
			}
			if user, err := p.Username(); err == nil {
				meta["user"] = user
			}

			sourceJSON, _ := json.Marshal(meta)
			details := fmt.Sprintf("Process: %s\nPID: %d", name, p.Pid)
			d.handler("endpoint", details, string(sourceJSON), 0.75, nil)
		}
	}
}

func isAIProcess(name, cmd string) bool {
	// Direct binary matches
	binaries := []string{"ollama", "llama-server", "localai"}
	for _, b := range binaries {
		if name == b || strings.Contains(cmd, b) {
			return true
		}
	}

	// Python + ML Libraries
	if name == "python" || name == "python3" {
		libs := []string{"torch", "tensorflow", "keras", "transformers", "huggingface", "langchain"}
		for _, l := range libs {
			if strings.Contains(cmd, l) {
				return true
			}
		}
	}

	return false
}
