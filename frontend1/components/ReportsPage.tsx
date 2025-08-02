import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Bug, Clock, ExternalLink, Filter, Search, ChevronDown, X, FileJson, Table, CheckCircle } from 'lucide-react';
import { RecentScan, ScanResult } from '../types';
import { formatTimestamp, cn } from '../lib/utils';
import { scanAPI } from '../lib/api';

interface ReportsPageProps {
  scans: RecentScan[];
  onScanClick: (scanId: string) => void;
  onRefresh: () => void;
  className?: string;
}

interface FilterState {
  dateRange: string;
  severity: string;
  searchTerm: string;
}

type ExportFormat = 'json' | 'csv' | 'pdf';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  scan: RecentScan;
}

const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  scan
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  if (!isOpen) return null;

  const exportOptions = [
    {
      format: 'json' as ExportFormat,
      label: 'JSON Format',
      description: 'Complete structured data with all vulnerability details, metadata, and scan statistics',
      icon: FileJson,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      format: 'csv' as ExportFormat,
      label: 'CSV Format',
      description: 'Spreadsheet-friendly format with vulnerability details, payloads, and recommendations',
      icon: Table,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      format: 'pdf' as ExportFormat,
      label: 'PDF Report',
      description: 'Professional HTML report with comprehensive findings and detailed analysis',
      icon: FileText,
      color: 'text-red-600 bg-red-50 border-red-200'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Fetch the complete scan results
      const response = await scanAPI.getScanResults(scan.id);
      
      if (!response.success) {
        throw new Error('Failed to fetch scan results');
      }
      
      const scanData = response.results;
      
      // Create comprehensive export data with all available details
      const exportData = {
        id: scan.id,
        url: scanData.summary?.scan_info?.target_url || scan.url || 'Unknown URL',
        timestamp: scan.timestamp,
        duration: scanData.summary?.scan_info?.duration || 0,
        totalVulnerabilities: scanData.summary?.scan_info?.total_vulnerabilities || 0,
        scanInfo: {
          startTime: scanData.summary?.scan_info?.start_time || scan.timestamp,
          endTime: scanData.summary?.scan_info?.end_time || scan.timestamp,
          totalUrlsScanned: scanData.summary?.scan_info?.total_urls_scanned || 0,
          totalLinksScanned: scanData.summary?.scan_info?.total_links_scanned || 0,
          totalFormsScanned: scanData.summary?.scan_info?.total_forms_scanned || 0,
          scanId: scanData.summary?.scan_info?.scan_id || scan.id
        },
        vulnerabilities: scanData.vulnerabilities || [],
        vulnerabilitiesByType: scanData.summary?.vulnerabilities_by_type || {},
        errorsByType: scanData.summary?.errors_by_type || {},
        performanceMetrics: {
          avgResponseTime: scanData.summary?.performance_metrics?.avg_response_time || 0,
          minResponseTime: scanData.summary?.performance_metrics?.min_response_time || 0,
          maxResponseTime: scanData.summary?.performance_metrics?.max_response_time || 0
        },
        scannedLinks: scanData.scanned_links || [],
        scannedForms: scanData.scanned_forms || [],
        scannedUrls: scanData.scanned_urls || []
      };

      if (selectedFormat === 'json') {
        downloadJSON(exportData);
      } else if (selectedFormat === 'csv') {
        downloadCSV(exportData);
      } else if (selectedFormat === 'pdf') {
        downloadPDF(exportData);
      }

      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again or check if the scan data is available.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data: any) => {
    // Create a comprehensive JSON export with all scan data
    const jsonExport = {
      reportInfo: {
        generatedAt: new Date().toISOString(),
        generatedBy: "WebSentinals Security Scanner",
        version: "1.0",
        format: "json"
      },
      scanResults: {
        scanId: data.id,
        targetUrl: data.url,
        scanTimestamp: data.timestamp,
        scanDuration: data.duration,
        summary: {
          totalVulnerabilities: data.totalVulnerabilities,
          totalUrlsScanned: data.scanInfo.totalUrlsScanned,
          totalLinksScanned: data.scanInfo.totalLinksScanned,
          totalFormsScanned: data.scanInfo.totalFormsScanned
        },
        performanceMetrics: data.performanceMetrics,
        vulnerabilitiesByType: data.vulnerabilitiesByType,
        errorsByType: data.errorsByType,
        vulnerabilities: data.vulnerabilities.map((vuln: any) => ({
          id: vuln.id || `vuln_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: vuln.type,
          severity: vuln.details?.severity || 'Unknown',
          url: vuln.url,
          file: vuln.file,
          timestamp: vuln.timestamp,
          description: vuln.details?.description,
          recommendation: vuln.details?.recommendation,
          payload: vuln.details?.payload,
          consequences: vuln.details?.consequences,
          inputField: vuln.details?.input_field,
          method: vuln.details?.method,
          parameter: vuln.details?.parameter,
          xssType: vuln.details?.xss_type,
          headerName: vuln.details?.header_name,
          headerDescription: vuln.details?.header_description,
          form: vuln.details?.form
        })),
        scannedLinks: data.scannedLinks,
        scannedForms: data.scannedForms,
        scannedUrls: data.scannedUrls
      }
    };
    
    const jsonString = JSON.stringify(jsonExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${data.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any) => {
    const csvHeaders = [
      'Type', 'Severity', 'URL', 'Description', 'Recommendation', 
      'Payload', 'Consequences', 'Timestamp', 'File', 'Input Field', 'Method'
    ];
    
    const csvRows = data.vulnerabilities.map((vuln: any) => [
      vuln.type || '',
      vuln.details?.severity || '',
      vuln.url || '',
      `"${(vuln.details?.description || '').replace(/"/g, '""')}"`,
      `"${(vuln.details?.recommendation || '').replace(/"/g, '""')}"`,
      `"${(vuln.details?.payload || '').replace(/"/g, '""')}"`,
      `"${(vuln.details?.consequences || '').replace(/"/g, '""')}"`,
      vuln.timestamp || '',
      vuln.file || '',
      vuln.details?.input_field || '',
      vuln.details?.method || ''
    ]);

    // Add scan summary row
    const summaryRow = [
      'SCAN_SUMMARY', '', data.url, 
      `"Scan completed with ${data.totalVulnerabilities} vulnerabilities found"`,
      '', '', '', data.timestamp, '', '', ''
    ];

    const csvContent = [
      csvHeaders.join(','),
      summaryRow.join(','),
      '---,---,---,---,---,---,---,---,---,---,---', // Separator
      ...csvRows.map((row: any) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${data.id}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any) => {
    const htmlContent = `
      <html>
        <head>
          <title>WebSentinals Security Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #667eea; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { color: #888; font-size: 16px; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 20px; font-weight: bold; margin-bottom: 15px; color: #333; border-bottom: 2px solid #eee; padding-bottom: 5px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-item { padding: 10px; background: #f8f9fa; border-radius: 5px; }
            .info-label { font-weight: bold; color: #555; }
            .vuln-item { border: 1px solid #ddd; padding: 20px; margin-bottom: 15px; border-radius: 8px; background: #fff; }
            .severity-critical { border-left: 5px solid #dc3545; background: #fff5f5; }
            .severity-high { border-left: 5px solid #fd7e14; background: #fff8f0; }
            .severity-medium { border-left: 5px solid #ffc107; background: #fffbf0; }
            .severity-low { border-left: 5px solid #28a745; background: #f0fff4; }
            .vuln-header { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
            .vuln-details { margin-top: 10px; }
            .vuln-field { margin-bottom: 8px; }
            .vuln-field strong { color: #555; }
            .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
            .stat-card { padding: 15px; border: 1px solid #ddd; border-radius: 8px; text-align: center; }
            .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
            .stat-label { color: #666; font-size: 14px; }
            .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .summary-table th, .summary-table td { padding: 10px; border: 1px solid #ddd; text-align: left; }
            .summary-table th { background: #f8f9fa; font-weight: bold; }
            .no-vulnerabilities { text-align: center; padding: 40px; color: #28a745; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">WebSentinals Security Report</div>
            <p class="subtitle">Comprehensive Web Security Assessment</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Scan Overview</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${data.totalVulnerabilities}</div>
                <div class="stat-label">Total Vulnerabilities</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${data.scanInfo.totalUrlsScanned}</div>
                <div class="stat-label">URLs Scanned</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${data.scanInfo.totalLinksScanned}</div>
                <div class="stat-label">Links Analyzed</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${data.scanInfo.totalFormsScanned}</div>
                <div class="stat-label">Forms Tested</div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Scan Information</div>
            <table class="summary-table">
              <tr><th>Target URL</th><td>${data.url}</td></tr>
              <tr><th>Scan Date</th><td>${formatTimestamp(data.timestamp)}</td></tr>
              <tr><th>Duration</th><td>${data.duration}s</td></tr>
              <tr><th>Scan ID</th><td>${data.scanInfo.scanId}</td></tr>
              <tr><th>Performance</th><td>Avg: ${data.performanceMetrics.avgResponseTime.toFixed(2)}s, Min: ${data.performanceMetrics.minResponseTime.toFixed(2)}s, Max: ${data.performanceMetrics.maxResponseTime.toFixed(2)}s</td></tr>
            </table>
          </div>

          <div class="section">
            <div class="section-title">Vulnerabilities by Type</div>
            <table class="summary-table">
              ${Object.entries(data.vulnerabilitiesByType).map(([type, count]) => `
                <tr><td>${type.replace(/_/g, ' ').toUpperCase()}</td><td>${count}</td></tr>
              `).join('')}
            </table>
          </div>

          <div class="section">
            <div class="section-title">Detailed Vulnerability Findings</div>
            ${data.vulnerabilities.length === 0 ? `
              <div class="no-vulnerabilities">
                🎉 No vulnerabilities found! Your website appears to be secure.
              </div>
            ` : `
              ${data.vulnerabilities.map((vuln: any, index: number) => `
                <div class="vuln-item severity-${(vuln.details?.severity || 'low').toLowerCase()}">
                  <div class="vuln-header">#${index + 1} ${vuln.type.replace(/_/g, ' ').toUpperCase()} - ${(vuln.details?.severity || 'Unknown').toUpperCase()}</div>
                  <div class="vuln-details">
                    <div class="vuln-field"><strong>URL:</strong> ${vuln.url}</div>
                    <div class="vuln-field"><strong>File:</strong> ${vuln.file || 'N/A'}</div>
                    <div class="vuln-field"><strong>Timestamp:</strong> ${vuln.timestamp}</div>
                    ${vuln.details?.description ? `<div class="vuln-field"><strong>Description:</strong> ${vuln.details.description}</div>` : ''}
                    ${vuln.details?.payload ? `<div class="vuln-field"><strong>Payload:</strong> <code>${vuln.details.payload}</code></div>` : ''}
                    ${vuln.details?.input_field ? `<div class="vuln-field"><strong>Affected Input:</strong> ${vuln.details.input_field}</div>` : ''}
                    ${vuln.details?.method ? `<div class="vuln-field"><strong>Method:</strong> ${vuln.details.method}</div>` : ''}
                    ${vuln.details?.recommendation ? `<div class="vuln-field"><strong>Recommendation:</strong> ${vuln.details.recommendation}</div>` : ''}
                    ${vuln.details?.consequences ? `<div class="vuln-field"><strong>Potential Impact:</strong> ${vuln.details.consequences}</div>` : ''}
                  </div>
                </div>
              `).join('')}
            `}
          </div>

          ${data.scannedLinks.length > 0 ? `
            <div class="section">
              <div class="section-title">Scanned Links (${data.scannedLinks.length})</div>
              <ul>
                ${data.scannedLinks.slice(0, 20).map((link: any) => `
                  <li>${link.target_url || link}</li>
                `).join('')}
                ${data.scannedLinks.length > 20 ? `<li><em>... and ${data.scannedLinks.length - 20} more links</em></li>` : ''}
              </ul>
            </div>
          ` : ''}

          ${data.scannedForms.length > 0 ? `
            <div class="section">
              <div class="section-title">Scanned Forms (${data.scannedForms.length})</div>
              <ul>
                ${data.scannedForms.slice(0, 10).map((form: any) => `
                  <li><strong>Action:</strong> ${form.action}, <strong>Method:</strong> ${form.method}, <strong>Inputs:</strong> ${form.inputs?.length || 0}</li>
                `).join('')}
                ${data.scannedForms.length > 10 ? `<li><em>... and ${data.scannedForms.length - 10} more forms</em></li>` : ''}
              </ul>
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Report Footer</div>
            <p><em>This report was generated by WebSentinals - Web Security Audit Platform</em></p>
            <p><strong>Disclaimer:</strong> This automated security scan provides a snapshot of potential vulnerabilities. Manual security testing and code review are recommended for comprehensive security assessment.</p>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${data.id}-${Date.now()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const url = scan.summary?.scan_info?.target_url || scan.url || 'Unknown URL';
  const totalVulns = scan.summary?.scan_info?.total_vulnerabilities || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export Security Report</h2>
            <p className="text-sm text-gray-500 mt-1">Export scan results for {url}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Scan Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Scan Summary - What will be exported</h3>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <span className="text-gray-500">Target URL:</span>
                <p className="font-medium text-gray-900 truncate">{url}</p>
              </div>
              <div>
                <span className="text-gray-500">Scan Date:</span>
                <p className="font-medium text-gray-900">{formatTimestamp(scan.timestamp)}</p>
              </div>
              <div>
                <span className="text-gray-500">Duration:</span>
                <p className="font-medium text-gray-900">{scan.summary?.scan_info?.duration || 0}s</p>
              </div>
              <div>
                <span className="text-gray-500">Issues Found:</span>
                <p className="font-medium text-gray-900">{totalVulns} vulnerabilities</p>
              </div>
              <div>
                <span className="text-gray-500">URLs Scanned:</span>
                <p className="font-medium text-gray-900">{scan.summary?.scan_info?.total_urls_scanned || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Links Analyzed:</span>
                <p className="font-medium text-gray-900">{scan.summary?.scan_info?.total_links_scanned || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Forms Tested:</span>
                <p className="font-medium text-gray-900">{scan.summary?.scan_info?.total_forms_scanned || 0}</p>
              </div>
              <div>
                <span className="text-gray-500">Scan ID:</span>
                <p className="font-medium text-gray-900 text-xs">{scan.summary?.scan_info?.scan_id || scan.id}</p>
              </div>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <h4 className="font-medium text-gray-700 mb-2">Export will include:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Complete vulnerability details with severity levels, payloads, and recommendations</li>
                <li>• Performance metrics and scan statistics</li>
                <li>• List of all scanned URLs, links, and forms</li>
                <li>• Vulnerability breakdown by type and category</li>
                <li>• Detailed remediation guidance for each finding</li>
                <li>• Scan metadata and configuration information</li>
              </ul>
            </div>
          </div>

          {/* Export Format Selection */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-4">Choose Export Format</h3>
            <div className="space-y-3">
              {exportOptions.map((option) => {
                const IconComponent = option.icon;
                return (
                  <div
                    key={option.format}
                    onClick={() => setSelectedFormat(option.format)}
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all duration-200",
                      selectedFormat === option.format
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg border",
                        selectedFormat === option.format ? "bg-primary-100 border-primary-200" : option.color
                      )}>
                        <IconComponent className={cn(
                          "h-5 w-5",
                          selectedFormat === option.format ? "text-primary-600" : option.color.split(' ')[0]
                        )} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{option.label}</h4>
                        <p className="text-sm text-gray-500">{option.description}</p>
                      </div>
                      {selectedFormat === option.format && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Export Progress or Success */}
          {(isExporting || exportComplete) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-3">
                {isExporting && (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <div>
                      <p className="font-medium text-blue-900">Generating Report...</p>
                      <p className="text-sm text-blue-700">Please wait while we prepare your export</p>
                    </div>
                  </>
                )}
                {exportComplete && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Export Complete!</p>
                      <p className="text-sm text-green-700">Your report has been downloaded</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || exportComplete}
            className={cn(
              "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all duration-200",
              isExporting || exportComplete
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-primary-500 to-primary-700 hover:from-primary-600 hover:to-primary-800 text-white transform hover:scale-[1.02]"
            )}
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                Exporting...
              </>
            ) : exportComplete ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Complete
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReportCard: React.FC<{
  scan: RecentScan;
  onClick: () => void;
  onExport: () => void;
}> = ({ scan, onClick, onExport }) => {
  const totalVulns = scan.summary?.scan_info?.total_vulnerabilities || 0;
  const duration = scan.summary?.scan_info?.duration || 0;
  const url = scan.summary?.scan_info?.target_url || scan.url || 'Unknown URL';

  const getSeverityColor = (vulnCount: number) => {
    if (vulnCount === 0) return 'text-green-600 bg-green-50';
    if (vulnCount <= 3) return 'text-yellow-600 bg-yellow-50';
    if (vulnCount <= 10) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  const getSeverityLabel = (vulnCount: number) => {
    if (vulnCount === 0) return 'Clean';
    if (vulnCount <= 3) return 'Low Risk';
    if (vulnCount <= 10) return 'Medium Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 group animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary-600 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              Security Report
            </h3>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <ExternalLink className="h-4 w-4 flex-shrink-0" />
            <span className="truncate" title={url}>{url}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{formatTimestamp(scan.timestamp)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>{Math.round(duration)}s scan</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2 ml-4">
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            getSeverityColor(totalVulns)
          )}>
            {getSeverityLabel(totalVulns)}
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Bug className="h-4 w-4" />
            <span>{totalVulns} issues</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="flex-1 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          View Details
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onExport();
          }}
          className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          <Download className="h-4 w-4" />
          Export
        </button>
      </div>
    </div>
  );
};

export const ReportsPage: React.FC<ReportsPageProps> = ({ 
  scans, 
  onScanClick,
  onRefresh,
  className 
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    severity: 'all',
    searchTerm: ''
  });
  const [selectedScan, setSelectedScan] = useState<RecentScan | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filteredScans, setFilteredScans] = useState<RecentScan[]>(scans);

  // Update filtered scans when scans or filters change
  useEffect(() => {
    let filtered = [...scans];

    // Filter by search term
    if (filters.searchTerm) {
      filtered = filtered.filter(scan => {
        const url = scan.summary?.scan_info?.target_url || scan.url || '';
        return url.toLowerCase().includes(filters.searchTerm.toLowerCase());
      });
    }

    // Filter by severity
    if (filters.severity !== 'all') {
      filtered = filtered.filter(scan => {
        const vulnCount = scan.summary?.scan_info?.total_vulnerabilities || 0;
        switch (filters.severity) {
          case 'clean':
            return vulnCount === 0;
          case 'low':
            return vulnCount > 0 && vulnCount <= 3;
          case 'medium':
            return vulnCount > 3 && vulnCount <= 10;
          case 'high':
            return vulnCount > 10;
          default:
            return true;
        }
      });
    }

    // Filter by date range
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.dateRange) {
        case '24h':
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }

      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(scan => 
          new Date(scan.timestamp) >= cutoffDate
        );
      }
    }

    setFilteredScans(filtered);
  }, [scans, filters]);

  const handleExportClick = (scan: RecentScan) => {
    setSelectedScan(scan);
    setShowExportModal(true);
  };

  const handleCloseExportModal = () => {
    setShowExportModal(false);
    setSelectedScan(null);
  };

  const totalReports = scans.length;
  const totalVulnerabilities = scans.reduce((sum, scan) => 
    sum + (scan.summary?.scan_info?.total_vulnerabilities || 0), 0
  );

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{totalReports}</p>
            </div>
            <div className="bg-primary-50 p-3 rounded-lg">
              <FileText className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues Found</p>
              <p className="text-2xl font-bold text-gray-900">{totalVulnerabilities}</p>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <Bug className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Scan Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {scans.length > 0 
                  ? Math.round(scans.reduce((sum, scan) => 
                      sum + (scan.summary?.scan_info?.duration || 0), 0
                    ) / scans.length)
                  : 0}s
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by URL..."
                value={filters.searchTerm}
                onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Date Range Filter */}
          <div className="relative">
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Severity Filter */}
          <div className="relative">
            <select
              value={filters.severity}
              onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value }))}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Severities</option>
              <option value="clean">Clean</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            <Clock className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Reports Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Security Reports ({filteredScans.length})
          </h2>
        </div>

        {filteredScans.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">
              {scans.length === 0 
                ? "No scan reports are available yet."
                : "No reports match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredScans.map((scan) => (
              <ReportCard
                key={scan.id}
                scan={scan}
                onClick={() => onScanClick(scan.id)}
                onExport={() => handleExportClick(scan)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Export Modal */}
      {selectedScan && (
        <ReportExportModal
          isOpen={showExportModal}
          onClose={handleCloseExportModal}
          scan={selectedScan}
        />
      )}
    </div>
  );
};
