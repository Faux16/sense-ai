# SENSE: Shadow Exposure & eNterprise Surveillance for AI

SENSE (Shadow Exposure & eNterprise Surveillance for AI) is a security tool designed to detect and monitor unauthorized or "shadow" AI instances within enterprise environments. By analyzing network traffic and endpoint processes, SENSE identifies potential AI-related activities, such as API calls to external AI services (e.g., OpenAI, Hugging Face) or local AI model execution. This enhances enterprise visibility and mitigates risks associated with unapproved AI usage.

> This project is under active development for presentation at Black Hat MEA, focusing on robust detection of shadow AI in enterprise networks.

---

## Features

- **Network Traffic Analysis**: Captures HTTP/HTTPS traffic using libpcap and gopacket to detect AI API calls (e.g., `api.openai.com`, `api.huggingface.co`).
- **Endpoint Scanning**: Simulates detection of AI-related processes (e.g., Python with TensorFlow) via a placeholder implementation.
- **REST API**: Exposes findings through a JSON-based API (`/findings`) powered by Gin.
- **SQLite Storage**: Logs findings with details (source/destination IPs, ports, headers, severity) in a local SQLite database.
- **Command-Line Interface**: Built with Cobra for easy scanning (`sense scan`) and API server management (`sense api`).
- **Detailed Output**: Reports findings with structured details, including IPs, ports, HTTP methods, headers, and payloads.

---

## Current Status

- **Version**: Pre-alpha (under development).

### Known Issues
- HTTPS API calls (e.g., OpenAI, Hugging Face) are not reliably detected due to encryption, resulting in garbled or skipped payloads.
- Endpoint scanning is a placeholder; real process inspection is not yet implemented.

### Next Steps
- Improve HTTPS detection with DNS-based methods or decryption.
- Replace endpoint placeholder with process inspection (e.g., eBPF).
- Expand regex patterns for additional AI APIs.
- Prepare for Black Hat MEA demo with enhanced output.

---

## Prerequisites
- **Go**: Version 1.23.2 or later
- **libpcap**: Version 1.10.5 or later (installed via Homebrew on macOS)
- **macOS**: Tested on Apple Silicon (M1/M2)

---

## Installation

### Clone the Repository
```bash
git clone https://github.com/Faux16/sense-ai.git
cd sense-ai
```

### Install Go Dependencies
```bash
go get github.com/google/gopacket
go get github.com/google/gopacket/layers
go get github.com/spf13/cobra
go get github.com/mattn/go-sqlite3
go get github.com/gin-gonic/gin
go mod tidy
```

### Install libpcap (macOS)
```bash
brew install libpcap
export PKG_CONFIG_PATH=/opt/homebrew/Cellar/libpcap/1.10.5/lib/pkgconfig:$PKG_CONFIG_PATH
export CGO_CFLAGS="-I/opt/homebrew/Cellar/libpcap/1.10.5/include"
export CGO_LDFLAGS="-L/opt/homebrew/Cellar/libpcap/1.10.5/lib"
```

### Build SENSE
```bash
go build -o sense
```

---

## Usage

### Run Network Scan
Scan for AI API calls and endpoint processes:
```bash
sudo ./sense scan --interface en0 --duration 30
```
- `--interface`: Network interface (e.g., `en0` for Wi-Fi, `lo0` for localhost)
- `--duration`: Scan duration in seconds

> Requires `sudo` for libpcap packet capture.

### Output Example
```
----------------------------------------
Detected AI-related process:
- Process: python3
- Library: TensorFlow
- Action: Placeholder detection (simulated AI model execution)
| Severity: 0.7
----------------------------------------
----------------------------------------
ID: 1
Type: endpoint
Details:
Detected AI-related process:
- Process: python3
- Library: TensorFlow
- Action: Placeholder detection (simulated AI model execution)
Time: 2025-06-21T12:52:15+05:30
Severity: 0.70
----------------------------------------
```

### Start REST API
Expose findings via a REST API:
```bash
./sense api --port 8080
```

### Access Findings
```bash
curl http://localhost:8080/findings
```

Returns JSON with findings (network and endpoint).

#### Example Output
```json
[
  {
    "id": 1,
    "type": "endpoint",
    "details": "Detected AI-related process:\n- Process: python3\n- Library: TensorFlow\n- Action: Placeholder detection (simulated AI model execution)",
    "timestamp": "2025-06-21T12:52:15+05:30",
    "severity": 0.7
  }
]
```

---

## Project Structure
```
main.go       # Core implementation (network scanning, REST API, endpoint placeholder)
go.mod, go.sum
.gitignore    # Excludes sense, sense.db, *.log
```

---

## Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/<name>`)
3. Commit changes (`git commit -m "Description"`)
4. Push to the branch (`git push origin feature/<name>`)
5. Open a pull request

---

## Future Work
- **HTTPS Detection**: Implement DNS-based detection or MITM proxy for encrypted API calls (e.g., OpenAI, Hugging Face).
- **Endpoint Scanning**: Replace placeholder with eBPF or process inspection for real-time monitoring.
- **Testing Environment**: Develop a mock HTTP server and Docker-based test lab to simulate AI API calls for reliable testing.
- **Regex Enhancement**: Expand patterns to cover additional AI APIs.
- **Visualization**: Add a web dashboard for findings.
- **Cross-Platform Support**: Extend compatibility to Linux and Windows.

---

## License
MIT License (pending formal addition).

---

## Contact
For questions or collaboration, contact via [GitHub Issues](https://github.com/Faux16/sense-ai/issues).

