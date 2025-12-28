#!/bin/bash

# SENSE System Status Check

echo "========================================="
echo "  SENSE System Status"
echo "========================================="
echo ""

# Check Management Server
echo "🔍 Checking Management Server..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo "✅ Management Server: Running on port 8080"
    HEALTH=$(curl -s http://localhost:8080/health | jq -r '.status')
    echo "   Status: $HEALTH"
else
    echo "❌ Management Server: Not responding"
fi

# Check gRPC Server
if lsof -i :9090 > /dev/null 2>&1; then
    echo "✅ gRPC Server: Running on port 9090"
else
    echo "❌ gRPC Server: Not running"
fi

# Check Frontend
echo ""
echo "🔍 Checking Frontend..."
if curl -s http://localhost:5173/ui/ > /dev/null 2>&1; then
    echo "✅ Frontend: Running on port 5173"
    echo "   URL: http://localhost:5173/ui/"
else
    echo "❌ Frontend: Not responding"
fi

# Check Database
echo ""
echo "🔍 Checking Database..."
if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "✅ PostgreSQL: Running on port 5432"
else
    echo "⚠️  PostgreSQL: Not detected (may be using different port)"
fi

# Check API Endpoints
echo ""
echo "🔍 Checking API Endpoints..."
AGENTS=$(curl -s http://localhost:8080/api/v1/agents | jq -r '.total')
echo "✅ Agents API: $AGENTS agents registered"

FINDINGS=$(curl -s http://localhost:8080/api/v1/findings | jq -r '.total')
echo "✅ Findings API: $FINDINGS findings"

echo ""
echo "========================================="
echo "  System Summary"
echo "========================================="
echo ""
echo "Management Server: http://localhost:8080"
echo "Frontend UI:       http://localhost:5173/ui/"
echo "gRPC Endpoint:     localhost:9090"
echo ""
echo "Quick Actions:"
echo "  • View Dashboard:  open http://localhost:5173/ui/"
echo "  • View Agents:     http://localhost:5173/ui/ (click Agents)"
echo "  • API Health:      curl http://localhost:8080/health"
echo "  • Install Agent:   ./scripts/install-agent.sh"
echo ""
