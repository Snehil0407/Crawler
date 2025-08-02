import React, { useState } from 'react';
import { Bug, Filter, Shield, ExternalLink, Clock, AlertTriangle } from 'lucide-react';
import { Vulnerability } from '../types';
import { getSeverity, formatVulnerabilityTitle, formatTimestamp, cn } from '../lib/utils';

interface VulnerabilityItemProps {
  vulnerability: Vulnerability;
  onClick: () => void;
}

const VulnerabilityItem: React.FC<VulnerabilityItemProps> = ({ vulnerability, onClick }) => {
  const severity = getSeverity(vulnerability);
  
  const severityConfig = {
    critical: { 
      color: 'text-critical', 
      bg: 'bg-red-100 dark:bg-red-900/30', 
      border: 'border-red-200 dark:border-red-800' 
    },
    high: { 
      color: 'text-high', 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      border: 'border-orange-200 dark:border-orange-800' 
    },
    medium: { 
      color: 'text-medium', 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      border: 'border-yellow-200 dark:border-yellow-800' 
    },
    low: { 
      color: 'text-low', 
      bg: 'bg-green-100 dark:bg-green-900/30', 
      border: 'border-green-200 dark:border-green-800' 
    },
  };

  const config = severityConfig[severity];

  return (
    <div 
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md dark:hover:shadow-lg transition-all cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex-1">
          {formatVulnerabilityTitle(vulnerability.type)}
        </h4>
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium uppercase",
          config.bg,
          config.color,
          config.border,
          "border"
        )}>
          {severity}
        </span>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
        {vulnerability.details?.description || 'No description available'}
      </p>
      
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          {vulnerability.url}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTimestamp(vulnerability.timestamp)}
        </span>
        {vulnerability.details?.form && (
          <span className="flex items-center gap-1">
            <Bug className="h-3 w-3" />
            Form vulnerability
          </span>
        )}
      </div>
    </div>
  );
};

interface VulnerabilitiesSectionProps {
  vulnerabilities: Vulnerability[];
  onVulnerabilityClick: (vulnerability: Vulnerability) => void;
  className?: string;
}

export const VulnerabilitiesSection: React.FC<VulnerabilitiesSectionProps> = ({ 
  vulnerabilities, 
  onVulnerabilityClick,
  className 
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  const filteredVulnerabilities = vulnerabilities.filter(vuln => {
    if (severityFilter === 'all') return true;
    return getSeverity(vuln) === severityFilter;
  });

  if (vulnerabilities.length === 0) {
    return (
      <section className={cn("mb-8", className)}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <div className="text-center">
            <Shield className="h-16 w-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Great! No vulnerabilities found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your website appears to be secure based on our analysis.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={cn("mb-8", className)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Detected Vulnerabilities
            </h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>

        {filteredVulnerabilities.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No vulnerabilities match the selected filter.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredVulnerabilities.map((vulnerability, index) => (
              <VulnerabilityItem
                key={vulnerability.id || index}
                vulnerability={vulnerability}
                onClick={() => onVulnerabilityClick(vulnerability)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
