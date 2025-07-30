export interface Vulnerability {
  id?: string;
  type: string;
  url: string;
  timestamp: string;
  details?: {
    description?: string;
    severity?: string;
    recommendation?: string;
    payload?: string;
    consequences?: string;
    form?: boolean;
  };
}

export interface ScanResult {
  summary?: {
    scan_info?: {
      total_vulnerabilities?: number;
      duration?: number;
      target_url?: string;
    };
  };
  vulnerabilities?: Vulnerability[];
  scanned_links?: string[];
  scanned_forms?: any[];
}

export interface ScanStatus {
  status: 'running' | 'completed' | 'failed';
  progress?: number;
  current_task?: string;
  error?: string;
}

export interface RecentScan {
  id: string;
  url?: string;
  timestamp: string;
  summary?: {
    scan_info?: {
      total_vulnerabilities?: number;
      duration?: number;
      target_url?: string;
    };
  };
}

export interface SeverityStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
}
