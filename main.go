package main

import (
    "database/sql"
    "fmt"
    "log"
    "net"
    "regexp"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/gopacket"
    "github.com/google/gopacket/layers"
    "github.com/google/gopacket/pcap"
    "github.com/spf13/cobra"
    _ "github.com/mattn/go-sqlite3"
)

// Finding represents a detected Shadow AI instance
type Finding struct {
    ID        int       `json:"id"`
    Type      string    `json:"type"`
    Details   string    `json:"details"`
    Timestamp time.Time `json:"timestamp"`
    Severity  float64   `json:"severity"`
}

// SENSE is the main struct for the Shadow AI detection tool
type SENSE struct {
    db          *sql.DB
    apiPatterns []*regexp.Regexp
    localIP     net.IP
}

// NewSENSE initializes the SENSE tool with a SQLite database
func NewSENSE(dbPath string) (*SENSE, error) {
    db, err := sql.Open("sqlite3", dbPath)
    if err != nil {
        return nil, fmt.Errorf("failed to open database: %v", err)
    }

    _, err = db.Exec(`
        CREATE TABLE IF NOT EXISTS findings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            details TEXT,
            timestamp TEXT,
            severity REAL
        )
    `)
    if err != nil {
        return nil, fmt.Errorf("failed to create table: %v", err)
    }

    patterns := []*regexp.Regexp{
        regexp.MustCompile(`api\.openai\.com`),
        regexp.MustCompile(`(api\.)?huggingface\.co`),
        regexp.MustCompile(`(?i)prompt.*completion`),
        regexp.MustCompile(`openai.*api`),
        regexp.MustCompile(`huggingface.*api`),
    }

    localIP, err := getLocalIP()
    if err != nil {
        log.Printf("Warning: Could not get local IP: %v", err)
    }

    return &SENSE{db: db, apiPatterns: patterns, localIP: localIP}, nil
}

// getLocalIP retrieves the machine's primary IP address
func getLocalIP() (net.IP, error) {
    conn, err := net.Dial("udp", "8.8.8.8:80")
    if err != nil {
        return nil, err
    }
    defer conn.Close()
    localAddr := conn.LocalAddr().(*net.UDPAddr)
    return localAddr.IP, nil
}

// Close cleans up resources
func (s *SENSE) Close() {
    if s.db != nil {
        s.db.Close()
    }
}

// ScanNetwork captures and analyzes network traffic for AI API calls
func (s *SENSE) ScanNetwork(interfaceName string, duration time.Duration) error {
    handle, err := pcap.OpenLive(interfaceName, 1600, true, pcap.BlockForever)
    if err != nil {
        return fmt.Errorf("failed to open interface %s: %v", interfaceName, err)
    }
    defer handle.Close()

    // Filter for HTTP and HTTPS traffic
    if err := handle.SetBPFFilter("tcp port 80 or tcp port 443"); err != nil {
        return fmt.Errorf("failed to set BPF filter: %v", err)
    }

    packetSource := gopacket.NewPacketSource(handle, handle.LinkType())
    timeout := time.After(duration)
    fmt.Printf("Scanning network on %s for %v (HTTP/HTTPS)...\n", interfaceName, duration)

    for {
        select {
        case packet := <-packetSource.Packets():
            var srcIP, dstIP string
            var srcPort, dstPort string
            protocol := "unknown"

            // Extract IP details
            if ipLayer := packet.Layer(layers.LayerTypeIPv4); ipLayer != nil {
                ip, _ := ipLayer.(*layers.IPv4)
                srcIP = ip.SrcIP.String()
                dstIP = ip.DstIP.String()
                protocol = strings.ToLower(ip.Protocol.String())
            }

            // Extract port details
            if tcpLayer := packet.Layer(layers.LayerTypeTCP); tcpLayer != nil {
                tcp, _ := tcpLayer.(*layers.TCP)
                srcPort = fmt.Sprintf("%d", tcp.SrcPort)
                dstPort = fmt.Sprintf("%d", tcp.DstPort)
            }

            // Log all packets for debugging
            log.Printf("Captured packet: %s:%s -> %s:%s (%s)", srcIP, srcPort, dstIP, dstPort, protocol)

            if appLayer := packet.ApplicationLayer(); appLayer != nil {
                payload := string(appLayer.Payload())
                // Log raw payload for debugging
                log.Printf("Raw payload (%d bytes): %v", len(payload), payload[:min(50, len(payload))])

                headers := extractHTTPHeaders(payload)
                method := extractHTTPMethod(payload)
                payloadLower := strings.ToLower(payload)
                isPrintablePayload := isPrintable(payload) && len(strings.TrimSpace(payload)) > 0

                for _, pattern := range s.apiPatterns {
                    if pattern.MatchString(payloadLower) {
                        var details string
                        if isPrintablePayload {
                            details = fmt.Sprintf("AI API Call Detected:\n- Source: %s:%s\n- Destination: %s:%s\n- Protocol: %s\n- Method: %s\n- Headers: %s\n- Payload: %s",
                                srcIP, srcPort, dstIP, dstPort, protocol, method, headers, payload[:min(100, len(payload))])
                        } else {
                            details = fmt.Sprintf("AI API Call Detected (Encrypted):\n- Source: %s:%s\n- Destination: %s:%s\n- Protocol: %s\n- Note: Payload is encrypted (likely HTTPS)\n- Raw Payload Sample: %v",
                                srcIP, srcPort, dstIP, dstPort, protocol, payload[:min(50, len(payload))])
                        }
                        severity := s.calculateSeverity(payloadLower)
                        s.logFinding("network", details, severity)
                        fmt.Println("----------------------------------------")
                        fmt.Println(details, "\n| Severity:", severity)
                        fmt.Println("----------------------------------------")
                    }
                }

                // Log if no pattern matched but payload exists
                if !isPrintablePayload {
                    log.Printf("Non-printable payload from %s:%s to %s:%s (%s): %v", srcIP, srcPort, dstIP, dstPort, protocol, payload[:min(50, len(payload))])
                }
            }
        case <-timeout:
            return nil
        }
    }
}

// extractHTTPHeaders extracts key HTTP headers from payload
func extractHTTPHeaders(payload string) string {
    lines := strings.Split(payload, "\r\n")
    var headers []string
    for _, line := range lines {
        if strings.HasPrefix(line, "Host:") || strings.HasPrefix(line, "User-Agent:") || strings.HasPrefix(line, "Content-Type:") {
            headers = append(headers, line)
        }
        if line == "" {
            break // End of headers
        }
    }
    return strings.Join(headers, "; ")
}

// extractHTTPMethod extracts the HTTP method (e.g., GET, POST) from payload
func extractHTTPMethod(payload string) string {
    lines := strings.Split(payload, "\r\n")
    if len(lines) > 0 {
        parts := strings.Split(lines[0], " ")
        if len(parts) > 0 {
            return parts[0]
        }
    }
    return "unknown"
}

// isPrintable checks if a string contains mostly printable ASCII characters
func isPrintable(s string) bool {
    for _, r := range s {
        if r < 32 || r > 126 {
            return false
        }
    }
    return true
}

// ScanEndpoints scans for AI-related processes and files (placeholder)
func (s *SENSE) ScanEndpoints() error {
    fmt.Println("Scanning endpoints...")
    details := "Detected AI-related process:\n- Process: python3\n- Library: TensorFlow\n- Action: Placeholder detection (simulated AI model execution)"
    severity := 0.7
    s.logFinding("endpoint", details, severity)
    fmt.Println("----------------------------------------")
    fmt.Println(details, "\n| Severity:", severity)
    fmt.Println("----------------------------------------")
    return nil
}

// calculateSeverity assigns a severity score
func (s *SENSE) calculateSeverity(payload string) float64 {
    severity := 0.5
    if strings.Contains(payload, "api_key") || strings.Contains(payload, "token") {
        severity += 0.3
    }
    if strings.Contains(payload, "prompt") {
        severity += 0.2
    }
    return minFloat(severity, 1.0)
}

// logFinding stores a finding in the database
func (s *SENSE) logFinding(findingType, details string, severity float64) error {
    _, err := s.db.Exec(
        "INSERT INTO findings (type, details, timestamp, severity) VALUES (?, ?, ?, ?)",
        findingType, details, time.Now().Format(time.RFC3339), severity,
    )
    if err != nil {
        return fmt.Errorf("failed to log finding: %v", err)
    }
    return nil
}

// GenerateReport outputs findings in JSON format
func (s *SENSE) GenerateReport() ([]Finding, error) {
    rows, err := s.db.Query("SELECT id, type, details, timestamp, severity FROM findings")
    if err != nil {
        return nil, fmt.Errorf("failed to query findings: %v", err)
    }
    defer rows.Close()

    var findings []Finding
    for rows.Next() {
        var f Finding
        var ts string
        if err := rows.Scan(&f.ID, &f.Type, &f.Details, &ts, &f.Severity); err != nil {
            return nil, fmt.Errorf("failed to scan row: %v", err)
        }
        f.Timestamp, _ = time.Parse(time.RFC3339, ts)
        findings = append(findings, f)
        fmt.Println("----------------------------------------")
        fmt.Printf("ID: %d\nType: %s\nDetails:\n%s\nTime: %s\nSeverity: %.2f\n", f.ID, f.Type, f.Details, ts, f.Severity)
        fmt.Println("----------------------------------------")
    }
    return findings, nil
}

// StartAPI exposes a REST API for findings
func (s *SENSE) StartAPI(port string) error {
    r := gin.Default()
    r.GET("/findings", func(c *gin.Context) {
        findings, err := s.GenerateReport()
        if err != nil {
            c.JSON(500, gin.H{"error": err.Error()})
            return
        }
        c.JSON(200, findings)
    })
    return r.Run(":" + port)
}

func min(a, b int) int {
    if a < b {
        return a
    }
    return b
}

func minFloat(a, b float64) float64 {
    if a < b {
        return a
    }
    return b
}

var rootCmd = &cobra.Command{
    Use:   "sense",
    Short: "SENSE: Shadow Exposure & eNterprise Surveillance for AI",
}

var scanCmd = &cobra.Command{
    Use:   "scan",
    Short: "Scan for Shadow AI instances",
    Run: func(cmd *cobra.Command, args []string) {
        interfaceName, _ := cmd.Flags().GetString("interface")
        duration, _ := cmd.Flags().GetInt("duration")

        sense, err := NewSENSE("sense.db")
        if err != nil {
            log.Fatalf("Failed to initialize: %v", err)
        }
        defer sense.Close()

        if err := sense.ScanNetwork(interfaceName, time.Duration(duration)*time.Second); err != nil {
            log.Printf("Network scan failed: %v", err)
        }
        if err := sense.ScanEndpoints(); err != nil {
            log.Printf("Endpoint scan failed: %v", err)
        }
        if _, err := sense.GenerateReport(); err != nil {
            log.Printf("Report generation failed: %v", err)
        }
    },
}

var apiCmd = &cobra.Command{
    Use:   "api",
    Short: "Start REST API server",
    Run: func(cmd *cobra.Command, args []string) {
        port, _ := cmd.Flags().GetString("port")
        sense, err := NewSENSE("sense.db")
        if err != nil {
            log.Fatalf("Failed to initialize: %v", err)
        }
        defer sense.Close()

        if err := sense.StartAPI(port); err != nil {
            log.Fatalf("API server failed: %v", err)
        }
    },
}

func init() {
    scanCmd.Flags().String("interface", "en0", "Network interface to scan")
    scanCmd.Flags().Int("duration", 60, "Network scan duration in seconds")
    apiCmd.Flags().String("port", "8080", "Port for REST API")
    rootCmd.AddCommand(scanCmd, apiCmd)
}

func main() {
    if err := rootCmd.Execute(); err != nil {
        log.Fatalf("Command execution failed: %v", err)
    }
}