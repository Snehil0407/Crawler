import React, { useState, useRef } from 'react';
import { Rocket, Loader2, StopCircle } from 'lucide-react';
import { scanAPI } from '../lib/api';
import { isValidUrl, cn } from '../lib/utils';

interface ScannerSectionProps {
  onScanStart?: (scanId: string) => void;
  onScanComplete?: (scanId: string) => void;
  className?: string;
}

export const ScannerSection: React.FC<ScannerSectionProps> = ({ 
  onScanStart, 
  onScanComplete,
  className 
}) => {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [isStopping, setIsStopping] = useState(false);
  
  // Refs to store interval IDs for cleanup
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setCurrentScanId(result.scanId);
      onScanStart?.(result.scanId);
      
      // Start monitoring progress
      monitorScanProgress(result.scanId);
      
    } catch (error) {
      console.error('Error starting scan:', error);
      alert('Failed to start scan. Please try again.');
      resetScanState();
    }
  };

  const handleStopScan = async () => {
    if (!currentScanId || isStopping) return;
    
    setIsStopping(true);
    setScanStatus('Stopping scan...');
    
    try {
      await scanAPI.stopScan(currentScanId);
      clearAllIntervals();
      setScanStatus('Scan stopped successfully');
      
      setTimeout(() => {
        resetScanState();
      }, 2000);
      
    } catch (error) {
      console.error('Error stopping scan:', error);
      alert('Failed to stop scan. Please try again.');
      setIsStopping(false);
    }
  };

  const clearAllIntervals = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
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
    progressIntervalRef.current = setInterval(() => {
      if (progressValue < 90) {
        progressValue += Math.random() * 15;
        setProgress(Math.min(progressValue, 90));
        
        const messageIndex = Math.floor((progressValue / 100) * messages.length);
        setScanStatus(messages[Math.min(messageIndex, messages.length - 1)]);
      }
    }, 2000);

    // Poll for completion
    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await scanAPI.getScanStatus(scanId);
        
        if (status.status === 'completed') {
          clearAllIntervals();
          setProgress(100);
          setScanStatus('Scan completed successfully!');
          
          // Notify parent component that scan is complete
          onScanComplete?.(scanId);
          
          setTimeout(() => {
            resetScanState();
          }, 2000);
        } else if (status.status === 'failed') {
          clearAllIntervals();
          alert('Scan failed: ' + (status.error || 'Unknown error'));
          resetScanState();
        } else if (status.status === 'stopped') {
          clearAllIntervals();
          setScanStatus('Scan was stopped');
          setTimeout(() => {
            resetScanState();
          }, 2000);
        }
      } catch (error) {
        console.error('Error checking scan status:', error);
      }
    }, 3000);

    // Timeout after 30 minutes
    timeoutRef.current = setTimeout(() => {
      clearAllIntervals();
      if (isScanning) {
        alert('Scan timed out after 30 minutes. The scan may still be running in the background.');
        resetScanState();
      }
    }, 1800000);
  };

  const resetScanState = () => {
    clearAllIntervals();
    setIsScanning(false);
    setScanStatus('');
    setProgress(0);
    setCurrentScanId(null);
    setIsStopping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleStartScan();
    }
  };

  return (
    <section className={cn("mb-8", className)}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
            <Rocket className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            Start Vulnerability Scan
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
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
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              disabled={isScanning}
            />
            {!isScanning ? (
              <button
                onClick={handleStartScan}
                disabled={isScanning}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                  "bg-primary-600 dark:bg-primary-700 hover:bg-primary-700 dark:hover:bg-primary-600 text-white shadow-lg hover:shadow-xl"
                )}
              >
                <Rocket className="h-4 w-4" />
                Start Scan
              </button>
            ) : (
              <button
                onClick={handleStopScan}
                disabled={isStopping}
                className={cn(
                  "px-6 py-3 rounded-lg font-medium transition-all flex items-center gap-2",
                  isStopping
                    ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-red-600 dark:bg-red-700 hover:bg-red-700 dark:hover:bg-red-600 text-white shadow-lg hover:shadow-xl"
                )}
              >
                {isStopping ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Stopping...
                  </>
                ) : (
                  <>
                    <StopCircle className="h-4 w-4" />
                    Stop Scan
                  </>
                )}
              </button>
            )}
          </div>

          {isScanning && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-3">
                <Loader2 className="h-4 w-4 animate-spin text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{scanStatus}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-400 dark:to-primary-500 h-2 rounded-full transition-all duration-500"
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
