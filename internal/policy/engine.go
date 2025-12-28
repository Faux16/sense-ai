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
	Name          string   `yaml:"name" json:"name"`
	Description   string   `yaml:"description" json:"description"`
	Target        string   `yaml:"target" json:"target"` // "network", "endpoint", "payload", "json_body"
	Match         []string `yaml:"match,omitempty" json:"match,omitempty"`
	Regex         string   `yaml:"regex,omitempty" json:"regex,omitempty"`
	JsonKey       string   `yaml:"json_key,omitempty" json:"json_key,omitempty"` // e.g. "messages" or "prompt"
	Action        Action   `yaml:"action" json:"action"`
	Severity      float64  `yaml:"severity" json:"severity"`
	regexCompiled *regexp.Regexp
}

func SavePolicies(path string, rules []Rule) error {
	config := struct {
		Policies []Rule `yaml:"policies"`
	}{
		Policies: rules,
	}

	data, err := yaml.Marshal(&config)
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
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

// EvaluateJSON checks a map[string]interface{} against rules
func (e *Engine) EvaluateJSON(data map[string]interface{}) *Rule {
	e.mu.RLock()
	defer e.mu.RUnlock()

	for _, rule := range e.Rules {
		if rule.Target != "json_body" {
			continue
		}

		// Extract value from JSON based on JsonKey
		// Simple implementation: check if key exists at top level for now,
		// or recursive search if needed. For LLM, we usually care about "messages" or "prompt"
		val, ok := data[rule.JsonKey]
		if !ok {
			// If key not found, maybe search recursively?
			// For now, simple top-level or specific structure support.
			continue
		}

		// Convert value to string for matching
		strVal := fmt.Sprintf("%v", val)

		// If it's a list of messages (OpenAI format), we might need to iterate
		if list, isList := val.([]interface{}); isList {
			for _, item := range list {
				// Naive string conversion of the whole object to search for patterns
				// Ideally we'd drill down to "content"
				itemStr := fmt.Sprintf("%v", item)
				if e.matches(rule, itemStr) {
					return &rule
				}
			}
		} else {
			if e.matches(rule, strVal) {
				return &rule
			}
		}
	}
	return nil
}

func (e *Engine) matches(rule Rule, input string) bool {
	input = strings.ToLower(input)

	for _, m := range rule.Match {
		if strings.Contains(input, strings.ToLower(m)) {
			return true
		}
	}

	if rule.regexCompiled != nil {
		if rule.regexCompiled.MatchString(input) {
			return true
		}
	}
	return false
}
