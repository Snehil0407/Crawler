import React, { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { scanAPI } from '../lib/api';
import { isValidUrl, cn } from '../lib/utils';

interface ScannerSectionProps {
  onScanStart?: (scanId: string) => void;
  className?: string;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({ 
  onScanStart, 
  className 
}) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [progress, setProgress] = useState(0);

  const handleStartScan = async () => {
    if (!url.trim()) {
      alert('Please enter a valid URL');
      return;
    }

    if (!isValidUrl(url)) {
      alert('Please enter a valid URL (must include http:// or https://)');
      return;
    }

    setIsScanning(true);
    setScanStatus('Initializing scan...');
    setProgress(10);

    try {
      const result = await scanAPI.startScan(url);
      onScanStart?.(result.scanId);
      
      // Start monitoring progress
      monitorScanProgress(result.scanId);
      
    } catch (error) {
      console.error('Error starting scan:', error);
      alert('Failed to start scan. Please try again.');
      resetScanState();
    }
  };

  const monitorScanProgress = async (scanId: string) => {
    const messages = [
      'Crawling website pages...',
      'Analyzing forms and inputs...',
      'Testing for SQL injection...',
      'Checking for XSS vulnerabilities...',
      'Scanning for security misconfigurations...',
      'Analyzing authentication mechanisms...',
      'Checking cryptographic implementations...',
      'Testing access controls...',
      'Finalizing scan results...'
    ];

    let progressValue = 10;
    const progressInterval = setInterval(() => {
      if (progressValue < 90) {
        progressValue += Math.random() * 15;
        setProgress(Math.min(progressValue, 90));
        
        const messageIndex = Math.floor((progressValue / 100) * messages.length);
        setScanStatus(messages[Math.min(messageIndex, messages.length - 1)]);
      }
    }, 2000);

    // Poll for completion
    const pollInterval = setInterval(async () => {
      try {
        const status = await scanAPI.getScanStatus(scanId);
        
        if (status.status === 'completed') {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setProgress(100);
          setScanStatus('Scan completed successfully!');
          
          setTimeout(() => {
            resetScanState();
          }, 2000);
        } else if (status.status === 'failed') {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          alert('Scan failed: ' + (status.error || 'Unknown error'));
          resetScanState();
        }
      } catch (error) {
        console.error('Error checking scan status:', error);
      }
    }, 3000);

    // Timeout after 30 minutes
    setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(pollInterval);
      if (isScanning) {
        alert('Scan timed out after 30 minutes. The scan may still be running in the background.');
        resetScanState();
      }
    }, 1800000);
  };

  const resetScanState = () => {
    setIsScanning(false);
    setScanStatus('');
    setProgress(0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartScan();
    }
  };

  return (
    <section className={cn("mb-8", className)}>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5 text-primary-600" />
            Start Vulnerability Scan
          </h2>
          <p className="text-gray-600">
            Enter your website URL to begin comprehensive security analysis
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter website URL (e.g., https://example.com)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
              disabled={isScanning}
            />
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className={cn(
                "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                isScanning
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-primary-600 hover:bg-primary-700 text-white shadow-lg hover:shadow-xl"
              )}
            >
              {isScanning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Start Scan
                </>
              )}
            </button>
          </div>

          {isScanning && (
            <div className="bg-gray-50 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600" />
                <span className="text-sm font-medium text-gray-700">{scanStatus}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
