package action

import (
	"fmt"
	"os/exec"
	"runtime"

	"github.com/shirou/gopsutil/v3/process"
)

type Remediator struct {
	dryRun bool
}

func NewRemediator(dryRun bool) *Remediator {
	return &Remediator{dryRun: dryRun}
}

// KillProcess terminates a process by PID
func (r *Remediator) KillProcess(pid int32) error {
	if r.dryRun {
		fmt.Printf("[DRY-RUN] Would kill process PID: %d\n", pid)
		return nil
	}

	p, err := process.NewProcess(pid)
	if err != nil {
		return fmt.Errorf("failed to find process: %w", err)
	}

	name, _ := p.Name()
	fmt.Printf("[REMEDIATE] Killing process: %s (PID: %d)\n", name, pid)

	return p.Kill()
}

// BlockIP blocks an IP address using the system firewall
func (r *Remediator) BlockIP(ip string) error {
	if r.dryRun {
		fmt.Printf("[DRY-RUN] Would block IP: %s\n", ip)
		return nil
	}

	fmt.Printf("[REMEDIATE] Blocking IP: %s\n", ip)

	switch runtime.GOOS {
	case "darwin":
		return r.blockIPMacOS(ip)
	case "linux":
		return r.blockIPLinux(ip)
	default:
		return fmt.Errorf("unsupported OS: %s", runtime.GOOS)
	}
}

func (r *Remediator) blockIPMacOS(ip string) error {
	// Use pfctl to add a blocking rule
	// Note: This requires root privileges and pfctl anchor setup
	// For now, we'll just log the action
	fmt.Printf("[INFO] IP blocking on macOS requires pfctl configuration\n")
	fmt.Printf("[INFO] Would block: %s\n", ip)
	return nil
}

func (r *Remediator) blockIPLinux(ip string) error {
	// Use iptables to block the IP
	cmd := exec.Command("iptables", "-A", "OUTPUT", "-d", ip, "-j", "DROP")
	return cmd.Run()
}

// UnblockIP removes a block on an IP address
func (r *Remediator) UnblockIP(ip string) error {
	if r.dryRun {
		fmt.Printf("[DRY-RUN] Would unblock IP: %s\n", ip)
		return nil
	}

	fmt.Printf("[REMEDIATE] Unblocking IP: %s\n", ip)

	switch runtime.GOOS {
	case "linux":
		cmd := exec.Command("iptables", "-D", "OUTPUT", "-d", ip, "-j", "DROP")
		return cmd.Run()
	default:
		return fmt.Errorf("unblock not implemented for %s", runtime.GOOS)
	}
}
