package policy

import (
	"fmt"
	"os"
	"regexp"
	"strings"
	"sync"

	"gopkg.in/yaml.v3"
)

type Action string

const (
	ActionAlert Action = "alert"
	ActionBlock Action = "block"
	ActionKill  Action = "kill"
)

type Rule struct {
	Name          string   `yaml:"name"`
	Description   string   `yaml:"description"`
	Target        string   `yaml:"target"` // "network", "endpoint", "payload"
	Match         []string `yaml:"match,omitempty"`
	Regex         string   `yaml:"regex,omitempty"`
	Action        Action   `yaml:"action"`
	Severity      float64  `yaml:"severity"`
	regexCompiled *regexp.Regexp
}

type Engine struct {
	Rules []Rule
	mu    sync.RWMutex
}

func NewEngine(path string) (*Engine, error) {
	e := &Engine{}
	if err := e.Load(path); err != nil {
		return nil, err
	}
	return e, nil
}

func (e *Engine) Load(path string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}

	var config struct {
		Policies []Rule `yaml:"policies"`
	}
	if err := yaml.Unmarshal(data, &config); err != nil {
		return err
	}

	for i := range config.Policies {
		if config.Policies[i].Regex != "" {
			re, err := regexp.Compile(config.Policies[i].Regex)
			if err != nil {
				fmt.Printf("[WARN] Failed to compile regex for policy '%s': %v (pattern: %s)\n",
					config.Policies[i].Name, err, config.Policies[i].Regex)
			} else {
				config.Policies[i].regexCompiled = re
			}
		}
	}

	e.Rules = config.Policies
	return nil
}

// Evaluate checks input against rules and returns the first matching rule (or nil)
func (e *Engine) Evaluate(target, input string) *Rule {
	e.mu.RLock()
	defer e.mu.RUnlock()

	input = strings.ToLower(input)

	for _, rule := range e.Rules {
		if rule.Target != target && rule.Target != "all" {
			continue
		}

		// 1. Direct Match (Contains)
		for _, m := range rule.Match {
			if strings.Contains(input, strings.ToLower(m)) {
				return &rule
			}
		}

		// 2. Regex Match
		if rule.regexCompiled != nil {
			if rule.regexCompiled.MatchString(input) {
				return &rule
			}
		}
	}
	return nil
}
