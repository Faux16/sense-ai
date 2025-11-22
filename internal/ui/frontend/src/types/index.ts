export interface Finding {
    id: number;
    type: string;
    details: string;
    source: string;
    timestamp: string;
    severity: number;
}

export interface SourceMetadata {
    [key: string]: any;
    matched_rule?: string;
    policy_action?: string;
}
