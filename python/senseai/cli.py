"""Command-line interface for SENSE."""

import json
import sys
import time
from typing import Optional

import click

from senseai import __version__
from senseai.client import SenseClient
from senseai.exceptions import APIError, ServerError
from senseai.server import SenseServer


@click.group()
@click.version_option(version=__version__, prog_name="senseai")
def main():
    """SENSE: Shadow Exposure & eNterprise Surveillance for AI"""
    pass


@main.command()
@click.option("--port", "-p", default=8080, help="Port to run the server on")
@click.option("--interface", "-i", default="en0", help="Network interface to monitor")
@click.option("--db", "-d", default="/tmp/sense.db", help="Path to database file")
@click.option("--policies", "-c", default="policies.yaml", help="Path to policies file")
@click.option("--sudo", is_flag=True, help="Run with sudo (required for network scanning)")
@click.option("--background", "-b", is_flag=True, help="Run server in background")
def start(
    port: int,
    interface: str,
    db: str,
    policies: str,
    sudo: bool,
    background: bool,
):
    """Start the SENSE backend server."""
    server = SenseServer(
        port=port,
        interface=interface,
        db_path=db,
        policy_file=policies,
        use_sudo=sudo,
    )
    
    try:
        server.start()
        
        if not background:
            click.echo(f"Server running at http://localhost:{port}")
            click.echo("Press Ctrl+C to stop...")
            try:
                # Keep running until interrupted
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                click.echo("\nShutting down...")
                server.stop()
        else:
            click.echo(f"Server started in background on port {port}")
            
    except ServerError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@main.command()
@click.option("--port", "-p", default=8080, help="Port the server is running on")
def stop(port: int):
    """Stop the SENSE backend server."""
    server = SenseServer(port=port)
    
    try:
        if not server.is_running():
            click.echo("Server is not running")
            return
        
        server.stop()
        click.echo("Server stopped successfully")
        
    except ServerError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@main.command()
@click.option("--port", "-p", default=8080, help="Port the server is running on")
def restart(port: int):
    """Restart the SENSE backend server."""
    server = SenseServer(port=port)
    
    try:
        server.restart()
        click.echo("Server restarted successfully")
        
    except ServerError as e:
        click.echo(f"Error: {e}", err=True)
        sys.exit(1)


@main.command()
@click.option("--port", "-p", default=8080, help="Port the server is running on")
@click.option("--json", "output_json", is_flag=True, help="Output in JSON format")
def status(port: int, output_json: bool):
    """Check the status of the SENSE backend server."""
    server = SenseServer(port=port)
    status_info = server.get_status()
    
    if output_json:
        click.echo(json.dumps(status_info, indent=2))
    else:
        if status_info["running"]:
            click.echo("✓ Server is running")
            click.echo(f"  Port: {status_info['port']}")
            click.echo(f"  Interface: {status_info['interface']}")
            click.echo(f"  Database: {status_info['db_path']}")
            if "pid" in status_info:
                click.echo(f"  PID: {status_info['pid']}")
            if "cpu_percent" in status_info:
                click.echo(f"  CPU: {status_info['cpu_percent']:.1f}%")
            if "memory_mb" in status_info:
                click.echo(f"  Memory: {status_info['memory_mb']:.1f} MB")
        else:
            click.echo("✗ Server is not running")


@main.command()
@click.option("--port", "-p", default=8080, help="Port the server is running on")
@click.option("--limit", "-n", type=int, help="Limit number of findings to display")
@click.option("--type", "-t", "finding_type", help="Filter by finding type")
@click.option("--min-severity", type=float, help="Minimum severity level")
@click.option("--json", "output_json", is_flag=True, help="Output in JSON format")
def findings(
    port: int,
    limit: Optional[int],
    finding_type: Optional[str],
    min_severity: Optional[float],
    output_json: bool,
):
    """List findings from the SENSE backend."""
    client = SenseClient(base_url=f"http://localhost:{port}")
    
    try:
        # Fetch findings
        all_findings = client.get_findings()
        
        # Apply filters
        filtered_findings = all_findings
        
        if finding_type:
            filtered_findings = [f for f in filtered_findings if f.get("type") == finding_type]
        
        if min_severity is not None:
            filtered_findings = [
                f for f in filtered_findings if f.get("severity", 0) >= min_severity
            ]
        
        if limit:
            filtered_findings = filtered_findings[:limit]
        
        # Output
        if output_json:
            click.echo(json.dumps(filtered_findings, indent=2))
        else:
            if not filtered_findings:
                click.echo("No findings found")
                return
            
            click.echo(f"Found {len(filtered_findings)} finding(s):\n")
            for i, finding in enumerate(filtered_findings, 1):
                click.echo(f"{i}. [{finding.get('type', 'unknown')}] {finding.get('details', 'N/A')}")
                click.echo(f"   Severity: {finding.get('severity', 0):.1f}")
                click.echo(f"   Timestamp: {finding.get('timestamp', 'N/A')}")
                click.echo()
        
    except APIError as e:
        click.echo(f"Error: {e}", err=True)
        click.echo("Is the server running? Try 'senseai status' to check.", err=True)
        sys.exit(1)


@main.command()
@click.option("--port", "-p", default=8080, help="Port the server is running on")
def stream(port: int):
    """Stream real-time findings from the SENSE backend."""
    client = SenseClient(base_url=f"http://localhost:{port}")
    
    click.echo("Streaming findings... (Press Ctrl+C to stop)\n")
    
    try:
        for finding in client.stream_findings():
            click.echo(f"[{finding.get('type', 'unknown')}] {finding.get('details', 'N/A')}")
            click.echo(f"  Severity: {finding.get('severity', 0):.1f} | {finding.get('timestamp', 'N/A')}")
            click.echo()
            
    except APIError as e:
        click.echo(f"\nError: {e}", err=True)
        sys.exit(1)
    except KeyboardInterrupt:
        click.echo("\nStopped streaming")


if __name__ == "__main__":
    main()
