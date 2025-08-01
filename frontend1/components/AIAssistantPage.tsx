import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageCircle, RefreshCw, FileText, AlertTriangle, Loader } from 'lucide-react';
import { scanAPI } from '../lib/api';
import { aiService } from '../lib/aiService';
import { isAIConfigured } from '../lib/aiConfig';
import { RecentScan, ScanResult } from '../types';
import { formatTimestamp, cn } from '../lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAssistantPageProps {
  scans: RecentScan[];
  onRefresh: () => void;
}

export const AIAssistantPage: React.FC<AIAssistantPageProps> = ({ scans, onRefresh }) => {
  const [selectedScanId, setSelectedScanId] = useState<string>('');
  const [selectedScanData, setSelectedScanData] = useState<ScanResult | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadScanData = async (scanId: string) => {
    if (!scanId) return;
    
    setIsLoadingScan(true);
    try {
      const response = await scanAPI.getScanResults(scanId);
      if (response.success) {
        setSelectedScanData(response.results);
        
        // Add a welcome message when scan is selected
        const welcomeMessage: Message = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `🤖 **AI Security Assistant Ready**

I've loaded the scan results for **${response.results.summary?.scan_info?.target_url || 'the selected URL'}**. 

📊 **Scan Summary:**
• Found ${response.results.vulnerabilities?.length || 0} vulnerabilities
• Powered by Google Gemini AI for intelligent analysis

🔍 **I can help you with:**
• **Vulnerability Analysis**: "What are the most critical vulnerabilities?"
• **Risk Assessment**: "Explain the security risks found"
• **Remediation Guidance**: "How do I fix the SQL injection issues?"
• **Code Examples**: "Show me secure coding practices"
• **Best Practices**: "What security improvements do you recommend?"

**Ask me anything about your security scan results!** 🛡️`,
          timestamp: new Date()
        };
        
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Error loading scan data:', error);
    } finally {
      setIsLoadingScan(false);
    }
  };

  const handleScanSelect = (scanId: string) => {
    setSelectedScanId(scanId);
    setMessages([]); // Clear previous messages
    loadScanData(scanId);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedScanData) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputMessage;
    setInputMessage('');
    setIsLoading(true);

    try {
      // Use the AI service to analyze the scan
      const response = await aiService.analyzeScan(selectedScanData, currentMessage);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.message,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or check your API configuration.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getScanSummary = (scan: RecentScan) => {
    const vulnerabilities = scan.summary?.scan_info?.total_vulnerabilities || 0;
    const url = scan.summary?.scan_info?.target_url || scan.url || 'Unknown URL';
    return { vulnerabilities, url };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">AI Security Assistant</h1>
        </div>
        <p className="text-gray-600">
          Select a recent scan and ask questions about vulnerabilities, security recommendations, and more.
        </p>
        
        {/* API Configuration Status */}
        <div className={cn(
          "mt-4 p-3 rounded-lg border text-sm",
          isAIConfigured() 
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-orange-200 bg-orange-50 text-orange-800"
        )}>
          {isAIConfigured() ? (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span>✅ AI Assistant is configured and ready (Gemini API)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>⚠️ Add your Gemini API key to .env.local to enable full AI capabilities</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scan Selection Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select Scan
              </h2>
              <button
                onClick={onRefresh}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {scans.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No scans available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {scans.map((scan) => {
                  const { vulnerabilities, url } = getScanSummary(scan);
                  const isSelected = selectedScanId === scan.id;
                  
                  return (
                    <div
                      key={scan.id}
                      onClick={() => handleScanSelect(scan.id)}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-all",
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      )}
                    >
                      <div className="font-medium text-sm truncate mb-1">
                        {url}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatTimestamp(scan.timestamp)}</span>
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>{vulnerabilities} issues</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Scan Summary */}
          {selectedScanData && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Scan Summary</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-medium">Target URL:</span>
                  <p className="text-gray-600 break-all">
                    {selectedScanData.summary?.scan_info?.target_url}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Total Vulnerabilities:</span>
                  <span className="ml-2 text-red-600">
                    {selectedScanData.vulnerabilities?.length || 0}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Scan Duration:</span>
                  <span className="ml-2 text-gray-600">
                    {Math.round(selectedScanData.summary?.scan_info?.duration || 0)}s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[600px] flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Security Analysis Chat</h2>
                {isLoadingScan && (
                  <Loader className="h-4 w-4 text-blue-600 animate-spin" />
                )}
              </div>
              {!selectedScanId && (
                <p className="text-sm text-gray-500 mt-1">
                  Select a scan to start asking questions
                </p>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!selectedScanId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Welcome to AI Security Assistant
                    </h3>
                    <p className="text-gray-500 max-w-md">
                      Select a scan from the left panel to start analyzing vulnerabilities 
                      and getting security recommendations powered by AI.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 && !isLoadingScan ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500">Loading scan data...</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.type === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.type === 'user'
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-900"
                      )}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>
                      <div
                        className={cn(
                          "text-xs mt-1",
                          message.type === 'user' ? "text-blue-100" : "text-gray-500"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <Loader className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    selectedScanId 
                      ? "Ask about vulnerabilities, security recommendations..." 
                      : "Select a scan first..."
                  }
                  disabled={!selectedScanId || isLoading}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!selectedScanId || !inputMessage.trim() || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                💡 <strong>Tip:</strong> You can ask about specific vulnerabilities, get remediation advice, 
                or request security best practices based on your scan results.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
