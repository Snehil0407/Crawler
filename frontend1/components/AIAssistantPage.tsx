import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageCircle, RefreshCw, FileText, AlertTriangle, Loader } from 'lucide-react';
import { scanAPI } from '../lib/api';
import { aiService } from '../lib/aiService';
import { RecentScan, ScanResult } from '../types';
import { formatTimestamp, cn } from '../lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Message content renderer with proper formatting
const MessageContent: React.FC<{ content: string; type: 'user' | 'assistant' }> = ({ content, type }) => {
  if (type === 'user') {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Helper function to parse markdown formatting within text
  const parseMarkdown = (text: string) => {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let keyCounter = 0;

    // Parse **bold** text
    const boldRegex = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Add the bold text
      parts.push(
        <strong key={`bold-${keyCounter++}`} className="font-semibold text-gray-900">
          {match[1]}
        </strong>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 1 ? parts : text;
  };

  // Enhanced formatting for assistant messages
  const formatContent = (text: string) => {
    return text
      .split('\n')
      .map((line, index) => {
        // Handle different types of formatting
        
        // Welcome message headers (lines with emojis)
        if (line.match(/^(🤖|📊|🔍).*$/)) {
          return (
            <div key={index} className="font-bold text-blue-900 mb-3 text-base border-b border-blue-100 pb-1">
              {parseMarkdown(line)}
            </div>
          );
        }
        
        // Numbered section headers (e.g., "**1. Broken Access Control**")
        if (line.match(/^\*\*\d+\.\s*.+\*\*/)) {
          return (
            <div key={index} className="font-bold text-red-800 mb-3 mt-4 text-lg bg-red-50 p-3 rounded-lg border-l-4 border-red-300">
              {parseMarkdown(line)}
            </div>
          );
        }
        
        // Subsection headers with asterisks (e.g., "* **Technical Details:**")
        if (line.match(/^\*\s*\*\*[^:]+:\*\*/)) {
          return (
            <div key={index} className="font-semibold text-blue-800 mb-2 mt-3 ml-2 bg-blue-50 p-2 rounded border-l-3 border-blue-300">
              {parseMarkdown(line)}
            </div>
          );
        }
        
        // Bullet points with categories (enhanced styling for welcome message)
        if (line.match(/^•\s*[^:]+:/)) {
          const [category, ...description] = line.replace('• ', '').split(':');
          return (
            <div key={index} className="ml-3 mb-2 p-2 bg-blue-50 rounded-md border-l-3 border-blue-300">
              <span className="text-blue-800">• </span>
              <span className="font-semibold text-blue-900">{category}:</span>
              <span className="text-gray-700 ml-1">{description.join(':')}</span>
            </div>
          );
        }
        
        // Regular bullet points with asterisks (improved pattern matching)
        if (line.match(/^\*\s/)) {
          return (
            <div key={index} className="ml-6 mb-2 text-gray-700 flex items-start">
              <span className="text-blue-600 mr-2 mt-1 text-xs">●</span>
              <span className="flex-1">{parseMarkdown(line.replace(/^\*\s/, ''))}</span>
            </div>
          );
        }
        
        // Additional catch for any remaining asterisk bullets
        if (line.startsWith('*') && !line.match(/^\*\*/) && line.includes(' ')) {
          return (
            <div key={index} className="ml-6 mb-2 text-gray-700 flex items-start">
              <span className="text-blue-600 mr-2 mt-1 text-xs">●</span>
              <span className="flex-1">{parseMarkdown(line.replace(/^\*\s*/, ''))}</span>
            </div>
          );
        }
        
        // Regular bullet points with •
        if (line.startsWith('• ')) {
          return (
            <div key={index} className="ml-4 mb-1 text-gray-700 flex items-start">
              <span className="text-blue-600 mr-2 mt-1 text-xs">●</span>
              <span className="flex-1">{parseMarkdown(line.replace('• ', ''))}</span>
            </div>
          );
        }
        
        // Lines that start with bold text (likely section introductions)
        if (line.match(/^\*\*[^*]+\*\*/)) {
          // Special styling for recommendations or overall sections
          if (line.toLowerCase().includes('recommendation') || line.toLowerCase().includes('overall')) {
            return (
              <div key={index} className="mb-3 mt-4 font-bold text-green-800 bg-green-50 p-3 rounded-lg border-l-4 border-green-300">
                {parseMarkdown(line)}
              </div>
            );
          }
          // Regular bold section headers
          return (
            <div key={index} className="mb-3 mt-2 font-medium text-gray-800 bg-gray-50 p-2 rounded">
              {parseMarkdown(line)}
            </div>
          );
        }
        
        // Final call-to-action line
        if (line.includes('Ask me anything') || line.includes('🛡️')) {
          return (
            <div key={index} className="font-semibold text-blue-700 mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              {parseMarkdown(line)}
            </div>
          );
        }
        
        // Regular lines with potential markdown
        if (line.trim()) {
          return (
            <div key={index} className="mb-2 text-gray-700 leading-relaxed">
              {parseMarkdown(line)}
            </div>
          );
        }
        
        // Empty lines for spacing
        return <div key={index} className="mb-2"></div>;
      });
  };

  return <div className="space-y-1">{formatContent(content)}</div>;
};

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
          content: `🤖 AI Security Assistant Ready

I've successfully loaded the scan results for ${response.results.summary?.scan_info?.target_url || 'the selected URL'}.

📊 Scan Summary:
• Total vulnerabilities found: ${response.results.vulnerabilities?.length || 0}
• Analysis powered by Google Gemini AI
• Ready for intelligent security consultation

🔍 I can help you with:
• Vulnerability Analysis: Ask "What are the most critical vulnerabilities?"
• Risk Assessment: Request "Explain the security risks found"
• Remediation Guidance: Inquire "How do I fix the SQL injection issues?"
• Code Examples: Ask "Show me secure coding practices"
• Best Practices: Request "What security improvements do you recommend?"
• Compliance: Ask "How do these findings relate to OWASP Top 10?"

Ask me anything about your security scan results - I'm here to help! 🛡️`,
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Scan Selection Panel */}
        <div className="xl:col-span-1">
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
        <div className="xl:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-[calc(100vh-12rem)] max-h-[800px] min-h-[600px] flex flex-col">
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
                    <p className="text-gray-500 font-medium">Preparing AI Security Assistant...</p>
                    <p className="text-sm text-gray-400 mt-1">Loading scan data and initializing analysis</p>
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
                        "max-w-[85%] rounded-lg px-5 py-4 shadow-sm",
                        message.type === 'user'
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-900 border border-gray-200"
                      )}
                    >
                      <MessageContent content={message.content} type={message.type} />
                      <div
                        className={cn(
                          "text-xs mt-2",
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
              
              {/* Quick Action Suggestions */}
              {selectedScanId && messages.length <= 1 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">💡 Quick suggestions:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "What are the most critical vulnerabilities?",
                      "How should I prioritize fixing these issues?",
                      "Show me remediation steps",
                      "Explain the security risks"
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInputMessage(suggestion)}
                        className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="mt-2 text-xs text-gray-500">
                💡 <strong>Tip:</strong> Ask specific questions about vulnerabilities, request remediation advice, 
                or get security best practices based on your scan results.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
