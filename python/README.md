# SENSE Python Wrapper

[![PyPI version](https://badge.fury.io/py/senseai.svg)](https://badge.fury.io/py/senseai)
[![Python versions](https://img.shields.io/pypi/pyversions/senseai.svg)](https://pypi.org/project/senseai/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Python wrapper for **SENSE** (Shadow Exposure & eNterprise Surveillance for AI) - a comprehensive security tool designed to detect and monitor unauthorized or "shadow" AI instances within enterprise environments.

## Features

- 🐍 **Pure Python API** - Easy integration with Python applications
- 🚀 **Simple CLI** - Command-line interface for quick operations
- 🔄 **Real-time Streaming** - Stream findings as they are detected
- 🎯 **Process Management** - Automatic backend lifecycle management
- 📦 **Zero Configuration** - Binary auto-download and setup

## Installation

```bash
pip install senseai
```

### Requirements

- Python 3.8+
- macOS or Linux (Windows support coming soon)
- `libpcap` for network scanning (install via `brew install libpcap` on macOS)

> **Note**: Network scanning requires `sudo` privileges. The package works without sudo but with limited functionality (endpoint detection only).

## Quick Start

### CLI Usage

```bash
# Start the SENSE server
senseai start --port 8080

# Check server status
senseai status

# List findings
senseai findings

# Stream real-time findings
senseai stream

# Stop the server
senseai stop
```

### Python API Usage

```python
from senseai import SenseClient, SenseServer

# Start the backend server
server = SenseServer(port=8080)
server.start()

# Use the API client
client = SenseClient(base_url="http://localhost:8080")

# Get all findings
findings = client.get_findings()
print(f"Found {len(findings)} findings")

# Filter by severity
critical_findings = client.get_findings_by_severity(min_severity=7.0)

# Stream real-time findings
for finding in client.stream_findings():
    print(f"[{finding['type']}] {finding['details']}")

# Cleanup
server.stop()
```

### Context Manager Usage

```python
from senseai import SenseServer, SenseClient

# Automatic cleanup with context manager
with SenseServer(port=8080) as server:
    with SenseClient() as client:
        findings = client.get_findings()
        print(findings)
```

## CLI Reference

### `senseai start`

Start the SENSE backend server.

**Options:**
- `--port, -p` - Port to run the server on (default: 8080)
- `--interface, -i` - Network interface to monitor (default: en0)
- `--db, -d` - Path to database file (default: /tmp/sense.db)
- `--policies, -c` - Path to policies file (default: policies.yaml)
- `--sudo` - Run with sudo for network scanning
- `--background, -b` - Run server in background

**Example:**
```bash
sudo senseai start --port 8080 --sudo --interface en0
```

### `senseai status`

Check the status of the SENSE backend server.

**Options:**
- `--port, -p` - Port the server is running on (default: 8080)
- `--json` - Output in JSON format

### `senseai findings`

List findings from the SENSE backend.

**Options:**
- `--port, -p` - Port the server is running on (default: 8080)
- `--limit, -n` - Limit number of findings to display
- `--type, -t` - Filter by finding type (network, endpoint)
- `--min-severity` - Minimum severity level
- `--json` - Output in JSON format

**Example:**
```bash
senseai findings --type network --min-severity 5.0 --limit 10
```

### `senseai stream`

Stream real-time findings from the SENSE backend.

**Options:**
- `--port, -p` - Port the server is running on (default: 8080)

### `senseai stop`

Stop the SENSE backend server.

**Options:**
- `--port, -p` - Port the server is running on (default: 8080)

## Python API Reference

### `SenseServer`

Manages the SENSE Go backend server process.

**Constructor:**
```python
SenseServer(
    port: int = 8080,
    interface: str = "en0",
    db_path: Optional[str] = None,
    policy_file: Optional[str] = None,
    use_sudo: bool = False,
)
```

**Methods:**
- `start(wait_for_ready=True, timeout=30)` - Start the server
- `stop(timeout=10)` - Stop the server
- `restart(timeout=30)` - Restart the server
- `is_running()` - Check if server is running
- `get_status()` - Get server status information

### `SenseClient`

Client for interacting with the SENSE REST API.

**Constructor:**
```python
SenseClient(
    base_url: str = "http://localhost:8080",
    timeout: int = 30,
)
```

**Methods:**
- `health_check()` - Check if server is responsive
- `get_findings(limit=None)` - Get all findings
- `stream_findings()` - Stream real-time findings (generator)
- `get_finding_by_id(finding_id)` - Get specific finding
- `get_findings_by_type(finding_type)` - Filter by type
- `get_findings_by_severity(min_severity, max_severity)` - Filter by severity

## Platform Support

| Platform | Status | Notes |
|----------|--------|-------|
| macOS (Intel) | ✅ Supported | Requires libpcap |
| macOS (Apple Silicon) | ✅ Supported | Requires libpcap |
| Linux (x86_64) | ✅ Supported | Requires libpcap |
| Linux (ARM64) | ✅ Supported | Requires libpcap |
| Windows | 🚧 Coming Soon | - |

## Troubleshooting

### Binary Download Fails

If the automatic binary download fails, you can manually build and install the Go binary:

```bash
# Clone the repository
git clone https://github.com/Faux16/sense-ai.git
cd sense-ai

# Build the binary
go build -o sense cmd/sense/main.go

# Make it available in PATH
sudo cp sense /usr/local/bin/
```

### Permission Errors

Network scanning requires root privileges:

```bash
# Run with sudo flag
sudo senseai start --sudo
```

Or run in limited mode (endpoint detection only):

```bash
# No sudo required
senseai start
```

### Port Already in Use

If port 8080 is already in use, specify a different port:

```bash
senseai start --port 8081
```

## Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/Faux16/sense-ai.git
cd sense-ai/python

# Install in development mode
pip install -e ".[dev]"

# Run tests
pytest tests/
```

### Running Tests

```bash
# Unit tests
pytest tests/test_binary.py tests/test_client.py -v

# Integration tests (requires Go binary)
pytest tests/test_integration.py -v

# All tests with coverage
pytest --cov=senseai --cov-report=html
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Links

- **GitHub**: https://github.com/Faux16/sense-ai
- **PyPI**: https://pypi.org/project/senseai/
- **Issues**: https://github.com/Faux16/sense-ai/issues
- **Documentation**: https://github.com/Faux16/sense-ai#readme

## Acknowledgments

Built with ❤️ for the security community. Presented at Black Hat MEA.
