export interface Finding {
    id: number;
    type: string;
    details: string;
    source: string;
    timestamp: string;
    severity: number;
}

export interface SourceMetadata {
    // Common fields
    matched_rule?: string;
    policy_action?: string;

    // Endpoint detection fields
    pid?: number;
    name?: string;
    cmdline?: string;
    parent_name?: string;
    parent_pid?: number;
    user?: string;

    // Network detection fields
    src_ip?: string;
    dst_ip?: string;
    src_port?: number;
    dst_port?: number;
    protocol?: string;
    domain?: string;
    sni?: string;
    payload_preview?: string;

    // Allow additional fields for extensibility
    [key: string]: string | number | boolean | undefined;
}
