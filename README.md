<div align="center">
  <img src="sense_logo.png" alt="SENSE Logo" width="200"/>
  <h1>SENSE: Shadow Exposure & eNterprise Surveillance for AI</h1>
  
  [![Go Version](https://img.shields.io/badge/Go-1.23.2+-00ADD8?style=flat&logo=go)](https://go.dev/)
  [![PyPI version](https://badge.fury.io/py/senseai.svg)](https://pypi.org/project/senseai/)
  [![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Linux-lightgrey.svg)](https://www.apple.com/macos/)

  <a href="https://www.producthunt.com/products/sense-14?embed=true&amp;utm_source=badge-featured&amp;utm_medium=badge&amp;utm_campaign=badge-sense-0661c741-8984-4946-9e89-61e2866150c9" target="_blank" rel="noopener noreferrer"><img alt="Sense - Shadow Exposure &amp; eNterprise Surveillance for AI | Product Hunt" width="250" height="54" src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1081915&amp;theme=light&amp;t=1771478892684"></a>
</div>

<br />

**SENSE** (Shadow Exposure & eNterprise Surveillance for AI) is an advanced **AI Security Platform** designed to monitor, control, and secure AI adoption within the enterprise. It features a transparent **AI Gateway** that intercepts and inspects LLM traffic, enforcing granular security policies for Data Loss Prevention (DLP) and Prompt Injection protection.

> **Note**: This project was presented at BlackHat MEA 2025.

---

## 🚀 Key Features

### 🛡️ Next-Gen AI Gateway
*   **Transparent Proxy**: Routes traffic to OpenAI, Anthropic, or Local LLMs (Ollama) seamlessly.
*   **Policy Enforcement**: Blocks malicious requests (e.g., Prompt Injection) and prevents sensitive data leaks (DLP) in real-time.
*   **Dynamic Configuration**: Manage routes and backends directly from the UI without restarts.

### 📊 Advanced Visualization & Dashboard
*   **Live World Map**: 3D visualization of global AI traffic and threat origins.
*   **Executive Dashboard**: High-level metrics on AI adoption, risk posture, and policy violations.
*   **Thirol Timeline**: Interactive timeline of blocked threats and anomalies.
*   **Network Intelligence**: Visual graph of internal services communicating with external AI APIs.

### 🧠 Intelligent Policy Management
*   **Visual Policy Editor**: Create, edit, and toggle security rules via the Dashboard.
*   **Granular Control**: Define rules based on JSON keys (`messages`, `prompt`), Regex patterns, or Keywords.
*   **AI Insights**: Automated analysis of blocked requests to identify patterns and emerging threats.

### 🔍 Deep Visibility & Detection
*   **Shadow AI Detection**: Passive sniffing (`libpcap`) to detect unauthorized "Shadow AI" API calls.
*   **Real-time Activity Logs**: Detailed audit trail of every intercepted request and violation.
*   **Process Monitoring**: Identify specific processes (e.g., `ollama`, python scripts) generating AI traffic.

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
