<div align="center">
  <img src="sense_logo.png" alt="SENSE Logo" width="200"/>
  <h1>SENSE: Shadow Exposure & eNterprise Surveillance for AI</h1>
  
  [![Go Version](https://img.shields.io/badge/Go-1.23.2+-00ADD8?style=flat&logo=go)](https://go.dev/)
  [![PyPI version](https://badge.fury.io/py/senseai.svg)](https://pypi.org/project/senseai/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux-lightgrey.svg)](https://www.apple.com/macos/)
</div>

<br />

**SENSE** (Shadow Exposure & eNterprise Surveillance for AI) is an advanced **AI Security Platform** designed to monitor, control, and secure AI adoption within the enterprise. It features a transparent **AI Gateway** that intercepts and inspects LLM traffic, enforcing granular security policies for Data Loss Prevention (DLP) and Prompt Injection protection.

> **Note**: This project was presented at BlackHat MEA 2025.

---

## 🚀 Key Features

### 🛡️ AI Gateway
*   **Transparent Proxy**: Routes traffic to OpenAI, Anthropic, or Local LLMs (Ollama) seamlessly.
*   **Policy Enforcement**: Blocks malicious requests (e.g., Prompt Injection) and prevents sensitive data leaks (DLP) in real-time.
*   **Dynamic Configuration**: Manage routes and backends directly from the UI without restarts.

### 🧠 Policy Management
*   **Visual Policy Editor**: Create, edit, and toggle security rules via the Dashboard.
*   **Granular Control**: Define rules based on JSON keys (`messages`, `prompt`), Regex patterns, or Keywords.
*   **Actionable Insights**: Choose between `Alert` (observe) or `Block` (enforce) modes.

### 🔍 Visibility & Detection
*   **Network Analysis**: Passive sniffing (`libpcap`) to detect unauthorized "Shadow AI" API calls.
*   **Real-time Dashboard**: Visualizes blocked threats, top users, and policy effectiveness.
*   **Activity Logs**: Detailed audit trail of every intercepted request and violation.

---

## 🛠 Prerequisites

*   **Go**: Version 1.23+
*   **Node.js**: Version 18+ (for Frontend)
*   **libpcap**: Required for network capture (`brew install libpcap` on macOS).

---

## 📦 Installation & Setup

### 1. Clone Repository
```bash
git clone https://github.com/Faux16/sense-ai.git
cd sense-ai
```

### 2. Install Dependencies
```bash
# Backend
go mod tidy

# Frontend
cd internal/ui/frontend
npm install
cd ../../..
```

### 3. Build Backend
```bash
go build -o sense cmd/sense/main.go
```

---

## 💻 Usage

### Quick Start (Recommended)
We provide a helper script to start both the **Gateway** and **Monitoring Engine** with the necessary permissions:

```bash
./scripts/start.sh
```
*Note: This script uses `sudo` to enable network packet capture.*

### Access the Dashboard
Open your browser to: **[http://localhost:5173/ui/](http://localhost:5173/ui/)**

### Using the Gateway
Direct your AI Client (e.g., LangChain, Python `openai` lib) to the Gateway:

```python
from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:8081/v1", # Point to SENSE Gateway
    api_key="unused" 
)

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello!"}]
)
```

---

## 📂 Project Structure
```
cmd/sense/      # Main entry point (Engine + API)
internal/
  ├── gateway/  # AI Gateway Proxy implementation
  ├── policy/   # Policy Engine (DLP/Injection checks)
  ├── api/      # REST API configuration endpoints
  └── ui/       # React Frontend (Dashboard & Editors)
scripts/        # Startup and testing scripts
policies.yaml   # Default security policies
gateway.yaml    # Routing configuration
```

---

## 📄 License
MIT License.
