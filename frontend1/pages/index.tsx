import React, { useState, useEffect } from 'react';
import ProtectedRoute from '../components/ProtectedRoute';
import { Header } from '../components/Header';
import { ScannerSection } from '../components/ScannerSection';
import { StatsSection } from '../components/StatsSection';
import { ChartsSection } from '../components/ChartsSection';
import { VulnerabilitiesSection } from '../components/VulnerabilitiesSection';
import { RecentScansSection } from '../components/RecentScansSection';
import { ReportsPage } from '../components/ReportsPage';
import { AIAssistantPage } from '../components/AIAssistantPage';
import { VulnerabilityModal } from '../components/VulnerabilityModal';
import { scanAPI } from '../lib/api';
import { ScanResult, Vulnerability, RecentScan, SeverityStats } from '../types';
import { getSeverity } from '../lib/utils';

export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanResults, setScanResults] = useState<ScanResult | null>(null);
  const [recentScans, setRecentScans] = useState<RecentScan[]>([]);
  const [dashboardRecentScans, setDashboardRecentScans] = useState<RecentScan[]>([]);
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState<SeverityStats>({
    critical: 0,
    high: 0,
    medium: 0,
    low: 0
  });

  // Load recent scans on component mount
  useEffect(() => {
    loadRecentScans();
    loadDashboardRecentScans();
  }, []);

  // Update stats when scan results change
  useEffect(() => {
    if (scanResults?.vulnerabilities) {
      updateStats(scanResults.vulnerabilities);
    }
  }, [scanResults]);

  const loadRecentScans = async () => {
    try {
      const response = await scanAPI.getRecentScans();
      if (response.success) {
        setRecentScans(response.scans);
      }
    } catch (error) {
      console.error('Error loading recent scans:', error);
    }
  };

  const loadDashboardRecentScans = async () => {
    try {
      const response = await scanAPI.getDashboardRecentScans();
      if (response.success) {
        setDashboardRecentScans(response.scans);
      }
    } catch (error) {
      console.error('Error loading dashboard recent scans:', error);
    }
  };

  const updateStats = (vulnerabilities: Vulnerability[]) => {
    const newStats: SeverityStats = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    };

    vulnerabilities.forEach(vuln => {
      const severity = getSeverity(vuln);
      newStats[severity]++;
    });

    setStats(newStats);
  };

  const handleScanStart = async (scanId: string) => {
    console.log('Scan started with ID:', scanId);
    
    // Monitor scan progress and update results when complete
    const monitorScan = async () => {
      try {
        const results = await scanAPI.getScanResults(scanId);
        if (results.success) {
          setScanResults(results.results);
          loadRecentScans(); // Refresh recent scans
          loadDashboardRecentScans(); // Refresh dashboard recent scans
        }
      } catch (error) {
        console.error('Error loading scan results:', error);
      }
    };

    // Poll for results (this is a simple implementation)
    // In a real app, you might want to use WebSockets or Server-Sent Events
    const pollInterval = setInterval(async () => {
      try {
        const status = await scanAPI.getScanStatus(scanId);
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          await monitorScan();
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          console.error('Scan failed');
        }
      } catch (error) {
        console.error('Error polling scan status:', error);
      }
    }, 5000);

    // Cleanup after 30 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
    }, 1800000);
  };

  const handleVulnerabilityClick = (vulnerability: Vulnerability) => {
    setSelectedVulnerability(vulnerability);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedVulnerability(null);
  };

  const handleScanClick = async (scanId: string) => {
    try {
      const results = await scanAPI.getScanResults(scanId);
      if (results.success) {
        setScanResults(results.results);
        // Switch to dashboard to show the scan results
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error loading historical scan:', error);
    }
  };

  const handleDashboardScanClick = async (scanId: string) => {
    try {
      const results = await scanAPI.getScanResults(scanId);
      if (results.success) {
        setScanResults(results.results);
        // Stay on dashboard, don't switch tabs
      }
    } catch (error) {
      console.error('Error loading historical scan from dashboard:', error);
    }
  };

  const handleAssistantScanClick = async (scanId: string) => {
    try {
      const results = await scanAPI.getScanResults(scanId);
      if (results.success) {
        setScanResults(results.results);
        // Switch to dashboard to show the scan results
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error loading historical scan from AI assistant:', error);
    }
  };

  const handleReportsScanClick = async (scanId: string) => {
    try {
      const results = await scanAPI.getScanResults(scanId);
      if (results.success) {
        setScanResults(results.results);
        // Switch to dashboard to show the scan results
        setActiveTab('dashboard');
      }
    } catch (error) {
      console.error('Error loading historical scan from reports:', error);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header activeTab={activeTab} onTabChange={setActiveTab} />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'dashboard' && (
            <>
              {/* Scanner Section */}
              <ScannerSection onScanStart={handleScanStart} />

              {/* Stats Section */}
              <StatsSection stats={stats} />

              {/* Recent Scans Section on Dashboard */}
              {dashboardRecentScans.length > 0 && (
                <RecentScansSection
                  scans={dashboardRecentScans}
                  onScanClick={handleDashboardScanClick}
                  onRefresh={loadDashboardRecentScans}
                  className="mb-8"
                  showTitle={true}
                  maxItems={3}
                />
              )}

              {/* Charts Section */}
              {scanResults?.vulnerabilities && scanResults.vulnerabilities.length > 0 && (
                <ChartsSection vulnerabilities={scanResults.vulnerabilities} />
              )}

              {/* Vulnerabilities Section */}
              {scanResults?.vulnerabilities && (
                <VulnerabilitiesSection
                  vulnerabilities={scanResults.vulnerabilities}
                  onVulnerabilityClick={handleVulnerabilityClick}
                />
              )}
            </>
          )}

          {activeTab === 'scans' && (
            <>
              <RecentScansSection
                scans={recentScans}
                onScanClick={handleScanClick}
                onRefresh={loadRecentScans}
              />
            </>
          )}

          {activeTab === 'reports' && (
            <ReportsPage
              scans={recentScans}
              onScanClick={handleReportsScanClick}
              onRefresh={loadRecentScans}
            />
          )}

          {activeTab === 'assistant' && (
            <AIAssistantPage
              scans={recentScans}
              onRefresh={loadRecentScans}
            />
          )}
        </main>

        {/* Vulnerability Modal */}
        <VulnerabilityModal
          vulnerability={selectedVulnerability}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </ProtectedRoute>
  );
}
