import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Bug, Clock, ExternalLink, Filter, Search, ChevronDown, X, FileJson, Table, CheckCircle } from 'lucide-react';
import { RecentScan, ScanResult } from '../types';
import { formatTimestamp, cn } from '../lib/utils';

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
      description: 'Machine-readable format for integration',
      icon: FileJson,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      format: 'csv' as ExportFormat,
      label: 'CSV Format',
      description: 'Spreadsheet format for analysis',
      icon: Table,
      color: 'text-green-600 bg-green-50 border-green-200'
    },
    {
      format: 'pdf' as ExportFormat,
      label: 'PDF Report',
      description: 'Professional report for sharing',
      icon: FileText,
      color: 'text-red-600 bg-red-50 border-red-200'
    }
  ];

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock data for demonstration
      const mockScanData = {
        id: scan.id,
        url: scan.summary?.scan_info?.target_url || scan.url,
        timestamp: scan.timestamp,
        duration: scan.summary?.scan_info?.duration || 0,
        totalVulnerabilities: scan.summary?.scan_info?.total_vulnerabilities || 0,
        vulnerabilities: [
          {
            type: 'XSS',
            severity: 'high',
            url: scan.summary?.scan_info?.target_url || scan.url,
            description: 'Cross-site scripting vulnerability detected'
          }
        ]
      };

      if (selectedFormat === 'json') {
        downloadJSON(mockScanData);
      } else if (selectedFormat === 'csv') {
        downloadCSV(mockScanData);
      } else if (selectedFormat === 'pdf') {
        downloadPDF(mockScanData);
      }

      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadJSON = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${scan.id}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadCSV = (data: any) => {
    const csvHeaders = ['Type', 'Severity', 'URL', 'Description'];
    const csvRows = data.vulnerabilities.map((vuln: any) => [
      vuln.type,
      vuln.severity,
      vuln.url,
      `"${vuln.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map((row: any) => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${scan.id}-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (data: any) => {
    const htmlContent = `
      <html>
        <head>
          <title>Security Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 30px; }
            .title { color: #667eea; font-size: 24px; font-weight: bold; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .vuln-item { border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 5px; }
            .severity-high { border-left: 4px solid #ff4757; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">WebSentinals Security Report</div>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
          <div class="section">
            <div class="section-title">Scan Information</div>
            <p><strong>Target URL:</strong> ${data.url}</p>
            <p><strong>Scan Date:</strong> ${formatTimestamp(data.timestamp)}</p>
            <p><strong>Duration:</strong> ${data.duration}s</p>
            <p><strong>Total Vulnerabilities:</strong> ${data.totalVulnerabilities}</p>
          </div>
          <div class="section">
            <div class="section-title">Vulnerabilities Found</div>
            ${data.vulnerabilities.map((vuln: any) => `
              <div class="vuln-item severity-${vuln.severity}">
                <h4>${vuln.type} - ${vuln.severity.toUpperCase()}</h4>
                <p><strong>URL:</strong> ${vuln.url}</p>
                <p><strong>Description:</strong> ${vuln.description}</p>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `security-report-${scan.id}-${Date.now()}.html`;
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
            <h3 className="font-medium text-gray-900 mb-3">Scan Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
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
