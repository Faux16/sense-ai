#!/bin/bash

# Ensure we are in the project root
cd "$(dirname "$0")/.."

echo "Starting SenseAI with Admin Privileges (Required for Network Capture)..."
echo "You may be asked for your password."

sudo ./sense & 
SENSE_PID=$!

echo "Starting SenseAI Gateway..."
./sense gateway &
GATEWAY_PID=$!

echo "SenseAI is running."
echo "Press Ctrl+C to stop both services."

# Wait for process and handle cleanup
trap "sudo kill $SENSE_PID; kill $GATEWAY_PID" SIGINT

wait $SENSE_PID
