# SENSE Wiki

Welcome to the **SENSE** (Shadow Exposure & eNterprise Surveillance for AI) documentation.

## 🏗️ Architecture

SENSE is built as a hybrid system comprising a high-performance Go backend and a modern React frontend.

### Components

1.  **Engine (`cmd/sense`)**: The core process. It runs:
    *   **API Server**: Exposes configuration and findings via REST.
    *   **Detectors**: `libpcap`-based network sniffer to find Shadow AI traffic.
    *   **Remediator**: Module to enforce actions like killing processes or blocking IPs.

2.  **Gateway (`sense gateway`)**: A dedicated Reverse Proxy optimized for LLM traffic.
    *   **Interceptor**: Reads JSON bodies from requests.
    *   **Policy Engine**: Evaluates requests against `policies.yaml`.
    *   **Router**: Forwards legitimate traffic to upstream providers (OpenAI, Ollama).

3.  **Frontend (`internal/ui/frontend`)**:
    *   **Dashboard**: Real-time metrics.
    *   **Editors**: Visual editors for `gateway.yaml` and `policies.yaml`.

---

## 🛡️ Policy Language

Policies are defined in YAML and can be managed via the UI.

### Structure
```yaml
- name: "Block Secrets"
  target: "json_body"       # Inspect JSON payload
  json_key: "messages"      # Look inside 'messages' array
  match:                    # List of keywords
    - "password"
    - "api_key"
  regex: "sk-[a-zA-Z0-9]+"  # Optional Regex pattern
  action: "block"           # Action: 'alert' or 'block'
  severity: 0.9             # Severity score (0.0 - 1.0)
```

### Targets
*   `json_body`: Inspects the HTTP request body (useful for Prompts).
*   `network`: Inspects the destination Hostname/IP.

---

## ⚙️ Gateway Configuration

The Gateway is configured via `gateway.yaml` or the **Settings** page in the UI.

### Routing Logic
The gateway matches the `path` prefix and proxies to the `target`.

**Example:**
*   **Path**: `/v1/`
*   **Target**: `https://api.openai.com`
*   **Incoming Request**: `POST http://localhost:8081/v1/chat/completions`
*   **Forwarded To**: `https://api.openai.com/v1/chat/completions`

---

## 🔧 Troubleshooting

### "Permission Denied" (Capture)
*   **Cause**: Network sniffing requires root access.
*   **Fix**: Always run with `./scripts/start.sh` or use `sudo ./sense`.

### "Address Already in Use"
*   **Cause**: Another process is using port 8080 (API) or 8081 (Gateway).
*   **Fix**: Run `lsof -i :8080` and kill the process, or let `start.sh` handle cleanup.

### UI Not Saving Config
*   **Cause**: Backend down or CORS issue.
*   **Status**: Fixed in v1.1. Ensure the backend is running.
