# SENSE Enterprise Deployment Guide

## Prerequisites

### Infrastructure Requirements

#### Minimum Requirements (< 1,000 agents)
- **Management Server**: 2 vCPU, 4GB RAM, 50GB SSD
- **PostgreSQL**: 2 vCPU, 8GB RAM, 100GB SSD
- **Redis**: 2 vCPU, 4GB RAM, 20GB SSD
- **Network**: 100 Mbps bandwidth

#### Recommended Requirements (1,000-5,000 agents)
- **Management Server**: 4 vCPU, 8GB RAM, 100GB SSD (2 instances for HA)
- **PostgreSQL**: 4 vCPU, 16GB RAM, 500GB SSD (with replica)
- **Redis**: 4 vCPU, 8GB RAM, 50GB SSD
- **Load Balancer**: 2 vCPU, 4GB RAM
- **Network**: 1 Gbps bandwidth

#### Enterprise Requirements (> 5,000 agents)
- **Management Server**: 8 vCPU, 16GB RAM, 200GB SSD (3+ instances)
- **PostgreSQL**: 8 vCPU, 32GB RAM, 1TB SSD (with replicas)
- **Redis**: 8 vCPU, 16GB RAM, 100GB SSD (cluster mode)
- **Load Balancer**: 4 vCPU, 8GB RAM (HA pair)
- **Network**: 10 Gbps bandwidth

### Software Requirements

- **Operating System**: Ubuntu 22.04 LTS, RHEL 8+, or compatible
- **Docker**: 24.0+ (for containerized deployment)
- **Kubernetes**: 1.28+ (for Kubernetes deployment)
- **PostgreSQL**: 15+
- **Redis**: 7+
- **TLS Certificates**: Valid certificates for all endpoints

---

## Deployment Options

### Option 1: Docker Compose (Development/Small Deployments)

Best for: Development, testing, small deployments (< 100 agents)

#### Step 1: Clone Repository
```bash
git clone https://github.com/Faux16/sense-ai.git
cd sense-ai
```

#### Step 2: Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
nano .env
```

**Required Environment Variables**:
```bash
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=sense
POSTGRES_USER=sense
POSTGRES_PASSWORD=<strong-password>

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=<strong-password>

# Management Server
SERVER_PORT=8080
GRPC_PORT=9090
JWT_SECRET=<random-secret>
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=<strong-password>

# TLS
TLS_CERT_PATH=/etc/sense/certs/server.crt
TLS_KEY_PATH=/etc/sense/certs/server.key
CA_CERT_PATH=/etc/sense/certs/ca.crt
```

#### Step 3: Generate TLS Certificates
```bash
# Create certificates directory
mkdir -p certs

# Generate CA certificate
openssl genrsa -out certs/ca.key 4096
openssl req -new -x509 -days 3650 -key certs/ca.key -out certs/ca.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=SENSE CA"

# Generate server certificate
openssl genrsa -out certs/server.key 4096
openssl req -new -key certs/server.key -out certs/server.csr \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=sense.example.com"
openssl x509 -req -days 365 -in certs/server.csr \
  -CA certs/ca.crt -CAkey certs/ca.key -CAcreateserial \
  -out certs/server.crt
```

#### Step 4: Deploy with Docker Compose
```bash
docker-compose up -d
```

#### Step 5: Verify Deployment
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f management-server

# Test API
curl -k https://localhost:8080/health
```

#### Step 6: Access Web UI
Open browser to: `https://localhost:8080/ui/`

Default credentials:
- Username: `admin@example.com`
- Password: (from ADMIN_PASSWORD in .env)

---

### Option 2: Kubernetes (Production)

Best for: Production deployments, high availability, scalability

#### Step 1: Prerequisites
```bash
# Verify Kubernetes cluster
kubectl cluster-info
kubectl get nodes

# Install Helm (if not already installed)
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

#### Step 2: Create Namespace
```bash
kubectl create namespace sense
kubectl config set-context --current --namespace=sense
```

#### Step 3: Create Secrets
```bash
# Database credentials
kubectl create secret generic postgres-credentials \
  --from-literal=username=sense \
  --from-literal=password=<strong-password> \
  --from-literal=database=sense

# Redis credentials
kubectl create secret generic redis-credentials \
  --from-literal=password=<strong-password>

# JWT secret
kubectl create secret generic jwt-secret \
  --from-literal=secret=<random-secret>

# TLS certificates
kubectl create secret tls sense-tls \
  --cert=certs/server.crt \
  --key=certs/server.key

kubectl create secret generic sense-ca \
  --from-file=ca.crt=certs/ca.crt
```

#### Step 4: Deploy PostgreSQL
```bash
# Using Helm chart
helm repo add bitnami https://charts.bitnami.com/bitnami
helm install postgres bitnami/postgresql \
  --set auth.username=sense \
  --set auth.password=<strong-password> \
  --set auth.database=sense \
  --set primary.persistence.size=100Gi \
  --set readReplicas.replicaCount=1 \
  --set readReplicas.persistence.size=100Gi
```

#### Step 5: Deploy Redis
```bash
helm install redis bitnami/redis \
  --set auth.password=<strong-password> \
  --set master.persistence.size=20Gi \
  --set replica.replicaCount=2 \
  --set replica.persistence.size=20Gi
```

#### Step 6: Deploy SENSE Components
```bash
# Apply Kubernetes manifests
kubectl apply -f deployments/kubernetes/

# Or use Helm chart
helm install sense ./deployments/helm/sense \
  --values deployments/helm/sense/values-production.yaml
```

#### Step 7: Verify Deployment
```bash
# Check pods
kubectl get pods

# Check services
kubectl get svc

# View logs
kubectl logs -f deployment/sense-management-server

# Check ingress
kubectl get ingress
```

#### Step 8: Configure Ingress
```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sense-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - sense.example.com
    secretName: sense-tls-cert
  rules:
  - host: sense.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: sense-api
            port:
              number: 8080
```

```bash
kubectl apply -f ingress.yaml
```

---

### Option 3: Manual Installation

Best for: Custom environments, air-gapped deployments

#### Step 1: Install PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-15 postgresql-contrib

# RHEL/CentOS
sudo dnf install postgresql15-server postgresql15-contrib
sudo postgresql-15-setup initdb
sudo systemctl enable --now postgresql-15
```

#### Step 2: Configure PostgreSQL
```bash
sudo -u postgres psql

-- Create database and user
CREATE DATABASE sense;
CREATE USER sense WITH ENCRYPTED PASSWORD '<strong-password>';
GRANT ALL PRIVILEGES ON DATABASE sense TO sense;
\q
```

Edit `/etc/postgresql/15/main/postgresql.conf`:
```ini
listen_addresses = '*'
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
work_mem = 20MB
maintenance_work_mem = 1GB
```

Edit `/etc/postgresql/15/main/pg_hba.conf`:
```
host    sense    sense    10.0.0.0/8    scram-sha-256
```

```bash
sudo systemctl restart postgresql
```

#### Step 3: Install Redis
```bash
# Ubuntu/Debian
sudo apt install redis-server

# RHEL/CentOS
sudo dnf install redis
```

Edit `/etc/redis/redis.conf`:
```ini
bind 0.0.0.0
requirepass <strong-password>
maxmemory 4gb
maxmemory-policy allkeys-lru
```

```bash
sudo systemctl enable --now redis
```

#### Step 4: Build SENSE Management Server
```bash
# Install Go
wget https://go.dev/dl/go1.23.2.linux-amd64.tar.gz
sudo tar -C /usr/local -xzf go1.23.2.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

# Clone and build
git clone https://github.com/Faux16/sense-ai.git
cd sense-ai
go build -o /usr/local/bin/sense-server cmd/server/main.go
```

#### Step 5: Create Configuration File
```bash
sudo mkdir -p /etc/sense
sudo nano /etc/sense/config.yaml
```

```yaml
server:
  port: 8080
  grpc_port: 9090
  tls:
    cert: /etc/sense/certs/server.crt
    key: /etc/sense/certs/server.key
    ca: /etc/sense/certs/ca.crt

database:
  host: localhost
  port: 5432
  database: sense
  user: sense
  password: <strong-password>
  max_connections: 100

redis:
  host: localhost
  port: 6379
  password: <strong-password>
  db: 0

auth:
  jwt_secret: <random-secret>
  token_expiry: 15m
  refresh_expiry: 168h

logging:
  level: info
  format: json
  output: /var/log/sense/server.log
```

#### Step 6: Create Systemd Service
```bash
sudo nano /etc/systemd/system/sense-server.service
```

```ini
[Unit]
Description=SENSE Management Server
After=network.target postgresql.service redis.service

[Service]
Type=simple
User=sense
Group=sense
ExecStart=/usr/local/bin/sense-server --config /etc/sense/config.yaml
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

```bash
# Create user
sudo useradd -r -s /bin/false sense

# Create log directory
sudo mkdir -p /var/log/sense
sudo chown sense:sense /var/log/sense

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable --now sense-server
sudo systemctl status sense-server
```

---

## Agent Deployment

### Using Ansible (Recommended)

#### Step 1: Prepare Inventory
```bash
# inventory/hosts.ini
[agents]
agent1.example.com ansible_user=admin
agent2.example.com ansible_user=admin
agent3.example.com ansible_user=admin

[agents:vars]
management_server=sense.example.com:9090
organization_id=org-123
```

#### Step 2: Deploy Agents
```bash
ansible-playbook -i inventory/hosts.ini deployments/ansible/deploy-agents.yml
```

### Manual Agent Installation

#### macOS
```bash
# Download agent
curl -LO https://github.com/Faux16/sense-ai/releases/latest/download/sense-agent-darwin-amd64

# Install
sudo mv sense-agent-darwin-amd64 /usr/local/bin/sense-agent
sudo chmod +x /usr/local/bin/sense-agent

# Configure
sudo mkdir -p /etc/sense
sudo tee /etc/sense/agent.yaml << EOF
server:
  address: sense.example.com:9090
  tls:
    ca_cert: /etc/sense/ca.crt
organization_id: org-123
agent_id: $(hostname)
EOF

# Copy CA certificate
sudo cp ca.crt /etc/sense/

# Install as service
sudo tee /Library/LaunchDaemons/com.sense.agent.plist << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.sense.agent</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/sense-agent</string>
        <string>--config</string>
        <string>/etc/sense/agent.yaml</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
EOF

sudo launchctl load /Library/LaunchDaemons/com.sense.agent.plist
```

#### Linux
```bash
# Download agent
curl -LO https://github.com/Faux16/sense-ai/releases/latest/download/sense-agent-linux-amd64

# Install
sudo mv sense-agent-linux-amd64 /usr/local/bin/sense-agent
sudo chmod +x /usr/local/bin/sense-agent

# Configure
sudo mkdir -p /etc/sense
sudo tee /etc/sense/agent.yaml << EOF
server:
  address: sense.example.com:9090
  tls:
    ca_cert: /etc/sense/ca.crt
organization_id: org-123
agent_id: $(hostname)
EOF

# Copy CA certificate
sudo cp ca.crt /etc/sense/

# Install as systemd service
sudo tee /etc/systemd/system/sense-agent.service << EOF
[Unit]
Description=SENSE Agent
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/sense-agent --config /etc/sense/agent.yaml
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now sense-agent
sudo systemctl status sense-agent
```

---

## Post-Deployment Configuration

### 1. Create First Organization
```bash
curl -X POST https://sense.example.com/api/v1/organizations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme",
    "admin_email": "admin@acme.com"
  }'
```

### 2. Create Users
```bash
curl -X POST https://sense.example.com/api/v1/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "analyst@acme.com",
    "name": "Security Analyst",
    "role": "analyst",
    "organization_id": "org-123"
  }'
```

### 3. Configure Policies
```bash
curl -X POST https://sense.example.com/api/v1/policies \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Block OpenAI",
    "organization_id": "org-123",
    "rules": [
      {
        "type": "network",
        "pattern": "api.openai.com",
        "action": "block",
        "severity": "high"
      }
    ]
  }'
```

### 4. Configure Integrations

#### SIEM (Splunk)
```bash
curl -X POST https://sense.example.com/api/v1/integrations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "splunk",
    "organization_id": "org-123",
    "config": {
      "hec_url": "https://splunk.example.com:8088",
      "hec_token": "your-hec-token",
      "index": "sense"
    }
  }'
```

#### Slack Notifications
```bash
curl -X POST https://sense.example.com/api/v1/integrations \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "slack",
    "organization_id": "org-123",
    "config": {
      "webhook_url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      "channel": "#security-alerts"
    }
  }'
```

---

## Monitoring Setup

### Prometheus
```bash
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'sense-management-server'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: '/metrics'
```

### Grafana Dashboards
```bash
# Import pre-built dashboards
curl -X POST http://grafana.example.com/api/dashboards/import \
  -H "Content-Type: application/json" \
  -d @deployments/monitoring/grafana-dashboards/sense-overview.json
```

---

## Troubleshooting

### Management Server Won't Start
```bash
# Check logs
journalctl -u sense-server -f

# Verify database connection
psql -h localhost -U sense -d sense

# Verify Redis connection
redis-cli -a <password> ping
```

### Agents Not Connecting
```bash
# Check agent logs
journalctl -u sense-agent -f

# Test connectivity
telnet sense.example.com 9090

# Verify certificates
openssl s_client -connect sense.example.com:9090 -CAfile /etc/sense/ca.crt
```

### High Memory Usage
```bash
# Check PostgreSQL
SELECT * FROM pg_stat_activity;

# Check Redis
redis-cli -a <password> info memory

# Adjust cache settings in config.yaml
```

---

## Backup and Recovery

### Database Backup
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR=/var/backups/sense
DATE=$(date +%Y%m%d_%H%M%S)

pg_dump -h localhost -U sense sense | gzip > $BACKUP_DIR/sense_$DATE.sql.gz

# Retain last 30 days
find $BACKUP_DIR -name "sense_*.sql.gz" -mtime +30 -delete
```

### Configuration Backup
```bash
# Backup configuration
tar -czf /var/backups/sense/config_$(date +%Y%m%d).tar.gz \
  /etc/sense/ \
  /etc/systemd/system/sense-*.service
```

### Restore Procedure
```bash
# Restore database
gunzip < /var/backups/sense/sense_20251204.sql.gz | \
  psql -h localhost -U sense sense

# Restore configuration
tar -xzf /var/backups/sense/config_20251204.tar.gz -C /

# Restart services
sudo systemctl restart sense-server
```

---

## Security Hardening

### Firewall Rules
```bash
# Allow only necessary ports
sudo ufw allow 8080/tcp  # API
sudo ufw allow 9090/tcp  # gRPC
sudo ufw enable
```

### SELinux Configuration (RHEL/CentOS)
```bash
# Create SELinux policy
sudo semanage port -a -t http_port_t -p tcp 8080
sudo semanage port -a -t http_port_t -p tcp 9090
```

### Regular Updates
```bash
# Update SENSE
./scripts/update-sense.sh

# Update system packages
sudo apt update && sudo apt upgrade -y
```

---

## Next Steps

1. ✅ Deploy infrastructure
2. ✅ Install management server
3. ✅ Deploy agents
4. ✅ Configure integrations
5. ✅ Set up monitoring
6. → Train users
7. → Establish operational procedures
8. → Plan for scaling
