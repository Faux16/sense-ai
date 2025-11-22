package detector

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"senseai/internal/policy"

	"github.com/google/gopacket"
	"github.com/google/gopacket/layers"
	"github.com/google/gopacket/pcap"
)

type NetworkDetector struct {
	iface   string
	handler func(string, string, string, float64, *policy.Rule) // type, details, source, severity, rule
	engine  *policy.Engine
}

func NewNetworkDetector(iface string, engine *policy.Engine, handler func(string, string, string, float64, *policy.Rule)) *NetworkDetector {
	return &NetworkDetector{
		iface:   iface,
		handler: handler,
		engine:  engine,
	}
}

func (d *NetworkDetector) Start(duration time.Duration) error {
	handle, err := pcap.OpenLive(d.iface, 1600, true, pcap.BlockForever)
	if err != nil {
		return err
	}
	defer handle.Close()

	// Filter for TCP (HTTP/HTTPS) and UDP (DNS)
	if err := handle.SetBPFFilter("tcp or udp port 53"); err != nil {
		fmt.Printf("Warning: Failed to set BPF filter: %v\n", err)
	}

	packetSource := gopacket.NewPacketSource(handle, handle.LinkType())
	timeout := time.After(duration)

	fmt.Printf("Scanning network on %s...\n", d.iface)

	for {
		select {
		case pkt := <-packetSource.Packets():
			if pkt == nil {
				continue
			}
			d.inspectPacket(pkt)
		case <-timeout:
			return nil
		}
	}
}

func (d *NetworkDetector) inspectPacket(pkt gopacket.Packet) {
	var srcIP, dstIP, srcPort, dstPort, protocol string

	// Extract IP Layer
	if ipLayer := pkt.Layer(layers.LayerTypeIPv4); ipLayer != nil {
		ip, _ := ipLayer.(*layers.IPv4)
		srcIP = ip.SrcIP.String()
		dstIP = ip.DstIP.String()
		protocol = ip.Protocol.String()
	} else if ipLayer := pkt.Layer(layers.LayerTypeIPv6); ipLayer != nil {
		ip, _ := ipLayer.(*layers.IPv6)
		srcIP = ip.SrcIP.String()
		dstIP = ip.DstIP.String()
		protocol = ip.NextHeader.String()
	}

	// Extract Transport Layer
	if tcpLayer := pkt.Layer(layers.LayerTypeTCP); tcpLayer != nil {
		tcp, _ := tcpLayer.(*layers.TCP)
		srcPort = tcp.SrcPort.String()
		dstPort = tcp.DstPort.String()
	} else if udpLayer := pkt.Layer(layers.LayerTypeUDP); udpLayer != nil {
		udp, _ := udpLayer.(*layers.UDP)
		srcPort = udp.SrcPort.String()
		dstPort = udp.DstPort.String()
	}

	meta := map[string]string{
		"src_ip":   srcIP,
		"dst_ip":   dstIP,
		"src_port": srcPort,
		"dst_port": dstPort,
		"protocol": protocol,
	}

	// 1. DNS Inspection
	if dnsLayer := pkt.Layer(layers.LayerTypeDNS); dnsLayer != nil {
		dns, _ := dnsLayer.(*layers.DNS)
		if dns.QR { // Response
			return
		}
		for _, q := range dns.Questions {
			name := string(q.Name)

			// Evaluate against policies
			rule := d.engine.Evaluate("network", name)
			if rule != nil {
				meta["query"] = name
				meta["type"] = "DNS"
				meta["matched_rule"] = rule.Name
				sourceJSON, _ := json.Marshal(meta)
				d.handler("network", fmt.Sprintf("DNS Query: %s (Rule: %s)", name, rule.Name), string(sourceJSON), rule.Severity, rule)
			} else if isAIEndpoint(name) {
				// Fallback to legacy detection
				meta["query"] = name
				meta["type"] = "DNS"
				sourceJSON, _ := json.Marshal(meta)
				d.handler("network", fmt.Sprintf("DNS Query: %s", name), string(sourceJSON), 0.6, nil)
			}
		}
	}

	// 2. TLS SNI Inspection (HTTPS)
	if tcpLayer := pkt.Layer(layers.LayerTypeTCP); tcpLayer != nil {
		if appLayer := pkt.ApplicationLayer(); appLayer != nil {
			payload := appLayer.Payload()
			// Check for TLS Handshake (ContentType 22)
			if len(payload) > 5 && payload[0] == 0x16 {
				sni := extractSNI(payload)
				if sni != "" {
					// Evaluate against policies
					rule := d.engine.Evaluate("network", sni)
					if rule != nil {
						meta["sni"] = sni
						meta["type"] = "HTTPS"
						meta["matched_rule"] = rule.Name
						sourceJSON, _ := json.Marshal(meta)
						d.handler("network", fmt.Sprintf("HTTPS Connection: %s (Rule: %s)", sni, rule.Name), string(sourceJSON), rule.Severity, rule)
					} else if isAIEndpoint(sni) {
						meta["sni"] = sni
						meta["type"] = "HTTPS"
						sourceJSON, _ := json.Marshal(meta)
						d.handler("network", fmt.Sprintf("HTTPS Connection: %s", sni), string(sourceJSON), 0.8, nil)
					}
				}
			} else {
				// Plain HTTP check + DLP
				content := strings.ToLower(string(payload))

				// DLP Check
				dlpRule := d.engine.Evaluate("payload", string(payload))
				if dlpRule != nil {
					meta["payload_preview"] = content[:min(len(content), 100)]
					meta["type"] = "DLP"
					meta["matched_rule"] = dlpRule.Name
					sourceJSON, _ := json.Marshal(meta)
					d.handler("network", fmt.Sprintf("DLP Violation: %s", dlpRule.Name), string(sourceJSON), dlpRule.Severity, dlpRule)
				} else if isAIEndpoint(content) {
					meta["payload_preview"] = content[:min(len(content), 100)]
					meta["type"] = "HTTP"
					sourceJSON, _ := json.Marshal(meta)
					d.handler("network", "Unencrypted Traffic to AI Service", string(sourceJSON), 0.9, nil)
				}
			}
		}
	}
}

func isAIEndpoint(s string) bool {
	s = strings.ToLower(s)
	targets := []string{
		"api.openai.com", "chatgpt.com",
		"huggingface.co", "api.anthropic.com",
		"claude.ai", "midjourney.com",
		"ollama", "replicate.com",
	}
	for _, t := range targets {
		if strings.Contains(s, t) {
			return true
		}
	}
	return false
}

// extractSNI attempts to parse the TLS Client Hello to find the SNI extension
func extractSNI(payload []byte) string {
	if len(payload) < 43 {
		return ""
	}

	offset := 5 // Skip Record Header
	if payload[offset] != 0x01 {
		return ""
	}
	offset += 4 // Skip Handshake Header

	offset += 2  // Skip Client Version
	offset += 32 // Skip Random

	if offset >= len(payload) {
		return ""
	}
	sessionIDLen := int(payload[offset])
	offset += 1 + sessionIDLen

	if offset+2 >= len(payload) {
		return ""
	}
	cipherSuitesLen := int(payload[offset])<<8 | int(payload[offset+1])
	offset += 2 + cipherSuitesLen

	if offset >= len(payload) {
		return ""
	}
	compressionMethodsLen := int(payload[offset])
	offset += 1 + compressionMethodsLen

	if offset+2 >= len(payload) {
		return ""
	}
	offset += 2

	for offset+4 <= len(payload) {
		extType := int(payload[offset])<<8 | int(payload[offset+1])
		extLen := int(payload[offset+2])<<8 | int(payload[offset+3])
		offset += 4

		if extType == 0x0000 { // Server Name
			if offset+2 > len(payload) {
				return ""
			}
			sniOffset := offset + 2
			if sniOffset+3 > len(payload) {
				return ""
			}
			nameLen := int(payload[sniOffset+1])<<8 | int(payload[sniOffset+2])
			sniOffset += 3
			if sniOffset+nameLen <= len(payload) {
				return string(payload[sniOffset : sniOffset+nameLen])
			}
		}
		offset += extLen
	}

	return ""
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
