import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { SeverityStats } from '../types';
import { cn } from '../lib/utils';

interface StatsCardProps {
  title: string;
  count: number;
  icon: React.ComponentType<{ className?: string }>;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, count, icon: Icon, severity }) => {
  const severityConfig = {
    critical: { color: 'text-critical', bg: 'bg-red-50', border: 'border-red-200' },
    high: { color: 'text-high', bg: 'bg-orange-50', border: 'border-orange-200' },
    medium: { color: 'text-medium', bg: 'bg-yellow-50', border: 'border-yellow-200' },
    low: { color: 'text-low', bg: 'bg-green-50', border: 'border-green-200' },
  };

  const config = severityConfig[severity];

  return (
    <div className={cn(
      "bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg",
      config.border
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{count}</p>
          <p className="text-sm text-gray-600 mt-1">{title}</p>
        </div>
        <div className={cn("p-3 rounded-lg", config.bg)}>
          <Icon className={cn("h-6 w-6", config.color)} />
        </div>
      </div>
    </div>
  );
};

interface StatsSectionProps {
  stats: SeverityStats;
  className?: string;
}

export const StatsSection: React.FC<StatsSectionProps> = ({ stats, className }) => {
  return (
    <section className={cn("mb-8", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Critical Issues"
          count={stats.critical}
          icon={AlertTriangle}
          severity="critical"
        />
        <StatsCard
          title="High Severity"
          count={stats.high}
          icon={AlertCircle}
          severity="high"
        />
        <StatsCard
          title="Medium Risk"
          count={stats.medium}
          icon={Info}
          severity="medium"
        />
        <StatsCard
          title="Low Priority"
          count={stats.low}
          icon={CheckCircle}
          severity="low"
        />
      </div>
    </section>
  );
};
