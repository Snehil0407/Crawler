import React from 'react';
import { 
  Chart as ChartJS, 
  ArcElement, 
  Tooltip, 
  Legend, 
  CategoryScale, 
  LinearScale, 
  BarElement 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { PieChart, BarChart3 } from 'lucide-react';
import { Vulnerability } from '../types';
import { getSeverity, getOwaspCategory } from '../lib/utils';
import { cn } from '../lib/utils';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

interface ChartsSectionProps {
  vulnerabilities: Vulnerability[];
  className?: string;
}

export const ChartsSection: React.FC<ChartsSectionProps> = ({ vulnerabilities, className }) => {
  // Calculate severity distribution
  const severityStats = vulnerabilities.reduce((acc, vuln) => {
    const severity = getSeverity(vuln);
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate OWASP distribution
  const owaspStats = vulnerabilities.reduce((acc, vuln) => {
    const category = getOwaspCategory(vuln.type);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const vulnerabilityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        severityStats.critical || 0,
        severityStats.high || 0,
        severityStats.medium || 0,
        severityStats.low || 0
      ],
      backgroundColor: [
        '#ff4757',
        '#ff6348',
        '#ffa502',
        '#2ed573'
      ],
      borderWidth: 0,
      hoverOffset: 8
    }]
  };

  const owaspChartData = {
    labels: Object.keys(owaspStats).slice(0, 8), // Show top 8 categories
    datasets: [{
      label: 'Vulnerabilities Found',
      data: Object.values(owaspStats).slice(0, 8),
      backgroundColor: '#667eea',
      borderColor: '#764ba2',
      borderWidth: 1,
      borderRadius: 8,
      borderSkipped: false as const,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  return (
    <section className={cn("mb-8", className)}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Vulnerability Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Vulnerability Distribution
            </h3>
          </div>
          <div className="h-64">
            <Doughnut data={vulnerabilityChartData} options={chartOptions} />
          </div>
        </div>

        {/* OWASP Top 10 Coverage Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="h-5 w-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              OWASP Top 10 Coverage
            </h3>
          </div>
          <div className="h-64">
            <Bar data={owaspChartData} options={barChartOptions} />
          </div>
        </div>
      </div>
    </section>
  );
};
