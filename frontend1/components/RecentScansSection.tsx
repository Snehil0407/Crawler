import React from 'react';
import { Clock, RefreshCw, Bug, ExternalLink } from 'lucide-react';
import { RecentScan } from '../types';
import { formatTimestamp, cn } from '../lib/utils';

interface RecentScanItemProps {
  scan: RecentScan;
  onClick: () => void;
}

const RecentScanItem: React.FC<RecentScanItemProps> = ({ scan, onClick }) => {
  const totalVulns = scan.summary?.scan_info?.total_vulnerabilities || 0;
  const duration = scan.summary?.scan_info?.duration || 0;
  const url = scan.summary?.scan_info?.target_url || scan.url || 'Unknown URL';

  return (
    <div 
      className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ExternalLink className="h-4 w-4 text-gray-500" />
            <p className="font-medium text-gray-900 truncate">{url}</p>
          </div>
          <p className="text-sm text-gray-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(scan.timestamp)}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Bug className="h-4 w-4" />
            <span>{totalVulns} issues</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{Math.round(duration)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RecentScansSectionProps {
  scans: RecentScan[];
  onScanClick: (scanId: string) => void;
  onRefresh: () => void;
  className?: string;
}

export const RecentScansSection: React.FC<RecentScansSectionProps> = ({ 
  scans, 
  onScanClick,
  onRefresh,
  className 
}) => {
  return (
    <section className={cn("mb-8", className)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Scans
            </h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-sm text-gray-500">
              💡 Visit the <span className="font-medium text-primary-600">Reports</span> tab for advanced export options
            </div>
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {scans.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              No recent scans available.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {scans.map((scan) => (
              <RecentScanItem
                key={scan.id}
                scan={scan}
                onClick={() => onScanClick(scan.id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
