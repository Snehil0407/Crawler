import React, { useState } from 'react';
import { Clock, RefreshCw, Bug, ExternalLink, Trash2 } from 'lucide-react';
import { RecentScan } from '../types';
import { formatTimestamp, cn } from '../lib/utils';
import { scanAPI } from '../lib/api';

interface RecentScanItemProps {
  scan: RecentScan;
  onClick: () => void;
  onDelete: (scanId: string) => void;
}

const RecentScanItem: React.FC<RecentScanItemProps> = ({ scan, onClick, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const totalVulns = scan.summary?.scan_info?.total_vulnerabilities || 0;
  const duration = scan.summary?.scan_info?.duration || 0;
  const url = scan.summary?.scan_info?.target_url || scan.url || 'Unknown URL';

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the onClick event
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete this scan?\n\nURL: ${url}\nDate: ${formatTimestamp(scan.timestamp)}\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    
    try {
      await onDelete(scan.id);
    } catch (error) {
      console.error('Error deleting scan:', error);
      alert('Failed to delete scan. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer animate-fade-in group hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-700"
      onClick={onClick}
      title="Click to view scan results on dashboard"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <ExternalLink className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{url}</p>
            <span className="text-xs text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
              View in Dashboard →
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTimestamp(scan.timestamp)}
          </p>
        </div>
        
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Bug className="h-4 w-4" />
            <span>{totalVulns} issues</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
            <Clock className="h-4 w-4" />
            <span>{Math.round(duration)}s</span>
          </div>
          
          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={cn(
              "p-2 rounded-lg transition-all opacity-0 group-hover:opacity-100",
              "hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 text-gray-400 dark:text-gray-500",
              isDeleting && "opacity-100 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 cursor-not-allowed"
            )}
            title="Delete scan"
          >
            <Trash2 className={cn("h-4 w-4", isDeleting && "animate-pulse")} />
          </button>
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
  showTitle?: boolean;
  maxItems?: number;
}

export const RecentScansSection: React.FC<RecentScansSectionProps> = ({ 
  scans, 
  onScanClick,
  onRefresh,
  className,
  showTitle = true,
  maxItems
}) => {
  const displayScans = maxItems ? scans.slice(0, maxItems) : scans;
  
  const handleDeleteScan = async (scanId: string) => {
    try {
      const result = await scanAPI.deleteScan(scanId);
      if (result.success) {
        // Refresh the scans list to remove the deleted scan
        onRefresh();
        // Show success message
        alert('Scan deleted successfully');
      } else {
        alert('Failed to delete scan: ' + result.message);
      }
    } catch (error: any) {
      console.error('Error deleting scan:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert('Failed to delete scan: ' + errorMessage);
    }
  };
  
  return (
    <section className={cn("mb-8", className)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {showTitle && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                My Scans
              </h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:block text-sm text-gray-500 dark:text-gray-400">
                💡 Visit the <span className="font-medium text-primary-600 dark:text-primary-400">Reports</span> tab for advanced export options
              </div>
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {displayScans.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              No scans found for your account.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Start your first vulnerability scan using the scanner above.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayScans.map((scan) => (
              <RecentScanItem
                key={scan.id}
                scan={scan}
                onClick={() => onScanClick(scan.id)}
                onDelete={handleDeleteScan}
              />
            ))}
            
            {maxItems && scans.length > maxItems && (
              <div className="text-center pt-4 border-t border-gray-100 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {maxItems} of {scans.length} scans. 
                  <span className="font-medium text-primary-600 dark:text-primary-400 ml-1">
                    Visit the My Scans tab to see all your results.
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
