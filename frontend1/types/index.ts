export interface Vulnerability {
  id?: string;
  type: string;
  url: string;
  timestamp: string;
  file?: string;
  details?: {
    description?: string;
    severity?: string;
    recommendation?: string;
    payload?: string;
    consequences?: string;
    form?: boolean;
    method?: string;
    input_field?: string;
    parameter?: string;
    xss_type?: string;
    header_name?: string;
    header_description?: string;
  };
}

export interface ScanResult {
  summary?: {
    scan_info?: {
      total_vulnerabilities?: number;
      duration?: number;
      target_url?: string;
      start_time?: string;
      end_time?: string;
      total_urls_scanned?: number;
      total_links_scanned?: number;
      total_forms_scanned?: number;
      scan_id?: string;
    };
    vulnerabilities_by_type?: Record<string, number>;
    errors_by_type?: Record<string, number>;
    performance_metrics?: {
      avg_response_time?: number;
      min_response_time?: number;
      max_response_time?: number;
    };
  };
  vulnerabilities?: Vulnerability[];
  scanned_links?: any[];
  scanned_forms?: any[];
  scanned_urls?: string[];
}

export interface ScanStatus {
  status: 'running' | 'completed' | 'failed' | 'stopped';
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
      start_time?: string;
      end_time?: string;
      total_urls_scanned?: number;
      total_links_scanned?: number;
      total_forms_scanned?: number;
      scan_id?: string;
    };
    vulnerabilities_by_type?: Record<string, number>;
    errors_by_type?: Record<string, number>;
    performance_metrics?: {
      avg_response_time?: number;
      min_response_time?: number;
      max_response_time?: number;
    };
  };
}

export interface SeverityStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
}
