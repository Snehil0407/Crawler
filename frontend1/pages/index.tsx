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

  const handleScanComplete = async (scanId: string) => {
    console.log('Scan completed with ID:', scanId);
    
    // Wait a moment for the backend to finish saving results
    setTimeout(async () => {
      // Load the completed scan results with retry logic
      let retries = 0;
      const maxRetries = 3;
      
      const loadResultsWithRetry = async () => {
        try {
          const results = await scanAPI.getScanResults(scanId);
          if (results.success) {
            setScanResults(results.results);
            return true;
          }
        } catch (error) {
          console.error('Error loading completed scan results:', error);
        }
        return false;
      };
      
      while (retries < maxRetries) {
        const success = await loadResultsWithRetry();
        if (success) break;
        
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
      
      // Refresh recent scans list to show the new completed scan
      loadRecentScans();
    }, 1000); // Wait 1 second for Firebase to be updated
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
              <ScannerSection 
                onScanStart={handleScanStart} 
                onScanComplete={handleScanComplete}
              />

              {/* Stats Section */}
              <StatsSection stats={stats} />

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
