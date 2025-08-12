import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, MessageCircle, RefreshCw, FileText, AlertTriangle, Loader, ChevronDown, Search, Copy, Check, Trash2, X, Menu } from 'lucide-react';
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

interface ChatSession {
  id: string;
  title: string;
  scanId: string;
  scanUrl: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
}

// Code block component with copy functionality
const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'text' }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 text-gray-300 px-4 py-2 rounded-t-lg text-sm">
        <span className="font-medium">{language}</span>
        <button
          onClick={copyToClipboard}
          className="flex items-center gap-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-b-lg overflow-x-auto text-sm leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Message content renderer with proper formatting
const MessageContent: React.FC<{ content: string; type: 'user' | 'assistant' }> = ({ content, type }) => {
  if (type === 'user') {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Enhanced formatting for assistant messages
  const formatContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let i = 0;
    let keyCounter = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Handle code blocks
      if (line.trim().startsWith('```')) {
        const language = line.replace('```', '').trim() || 'text';
        const codeLines: string[] = [];
        i++; // Move past the opening ```
        
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        
        if (codeLines.length > 0) {
          elements.push(
            <CodeBlock 
              key={`code-${keyCounter++}`} 
              code={codeLines.join('\n')} 
              language={language} 
            />
          );
        }
        i++; // Move past the closing ```
        continue;
      }

      // Welcome message headers (lines with emojis)
      if (line.match(/^(🤖|📊|🔍).*$/)) {
        elements.push(
          <div key={keyCounter++} className="font-bold text-blue-900 dark:text-blue-100 mb-4 text-lg border-b-2 border-blue-200 dark:border-blue-700 pb-2">
            {line}
          </div>
        );
        i++;
        continue;
      }
      
      // Main numbered section headers - Clean all variations of formatting
      if (line.match(/^\*?\*?\d+\.\s*.+/)) {
        // Remove all asterisks and clean up the line
        let cleanLine = line.replace(/^\*+\s*/, '').replace(/\*+$/, '').replace(/\*+/g, '').trim();
        
        elements.push(
          <div key={keyCounter++} className="font-bold text-red-800 dark:text-red-200 mb-4 mt-6 text-xl bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border-l-4 border-red-400 dark:border-red-600 shadow-sm">
            {cleanLine}
          </div>
        );
        i++;
        continue;
      }
      
      // Subsection headers - Handle various asterisk patterns
      if (line.match(/^\*+\s*[^*]*[A-Za-z][^*]*:/) || line.match(/^\*+\s*\*+[^*]+:\*+/)) {
        // Clean all asterisks and colons, preserve the content
        let cleanLine = line.replace(/^\*+\s*/, '').replace(/\*+/g, '').replace(/:+$/, ':').trim();
        
        elements.push(
          <div key={keyCounter++} className="font-semibold text-blue-800 dark:text-blue-200 mb-3 mt-4 ml-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border-l-3 border-blue-400 dark:border-blue-600">
            {cleanLine}
          </div>
        );
        i++;
        continue;
      }

      // Special handling for "Remediation Steps:" or similar important headers
      if (line.match(/remediation\s+steps|potential\s+attack|security\s+implications|technical\s+details/i)) {
        let cleanLine = line.replace(/^\*+\s*/, '').replace(/\*+/g, '').trim();
        
        // Special color for remediation
        const isRemediation = line.match(/remediation/i);
        const colorClass = isRemediation 
          ? "text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-600" 
          : "text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-900/20 border-blue-400 dark:border-blue-600";
        
        elements.push(
          <div key={keyCounter++} className={`font-semibold mb-3 mt-4 ml-2 p-3 rounded-lg border-l-3 ${colorClass}`}>
            {cleanLine}
          </div>
        );
        i++;
        continue;
      }
      
      // Bullet points - Clean various bullet formats
      if (line.match(/^\s*[•*-]\s/) || line.match(/^\*+\s+[^*]/)) {
        // Remove bullet symbols and asterisks
        let cleanLine = line.replace(/^\s*[•*-]\s*/, '').replace(/^\*+\s*/, '').trim();
        
        // Check if it's a category bullet point (has colon)
        if (cleanLine.includes(':') && !cleanLine.endsWith(':')) {
          const [category, ...description] = cleanLine.split(':');
          elements.push(
            <div key={keyCounter++} className="ml-4 mb-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border-l-4 border-gray-300 dark:border-gray-600">
              <span className="font-semibold text-gray-900 dark:text-gray-100">{category.trim()}:</span>
              <span className="text-gray-700 dark:text-gray-300 ml-2">{description.join(':').trim()}</span>
            </div>
          );
        } else {
          elements.push(
            <div key={keyCounter++} className="ml-6 mb-2 text-gray-700 dark:text-gray-300 flex items-start">
              <span className="text-blue-600 dark:text-blue-400 mr-3 mt-1 text-sm">•</span>
              <span className="flex-1 leading-relaxed">{cleanLine}</span>
            </div>
          );
        }
        i++;
        continue;
      }
      
      // Bold text sections - Remove asterisks completely
      if (line.match(/\*\*.*\*\*/) && !line.match(/^\d+\./)) {
        let cleanLine = line.replace(/\*\*/g, '').trim();
        
        // Special styling for recommendations or overall sections
        if (cleanLine.toLowerCase().includes('recommendation') || cleanLine.toLowerCase().includes('remediation')) {
          elements.push(
            <div key={keyCounter++} className="mb-4 mt-4 font-bold text-green-800 dark:text-green-200 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-l-4 border-green-400 dark:border-green-600">
              {cleanLine}
            </div>
          );
        } else {
          elements.push(
            <div key={keyCounter++} className="mb-3 mt-3 font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
              {cleanLine}
            </div>
          );
        }
        i++;
        continue;
      }
      
      // Final call-to-action line
      if (line.includes('Ask me anything') || line.includes('🛡️')) {
        elements.push(
          <div key={keyCounter++} className="font-semibold text-blue-700 dark:text-blue-300 mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            {line}
          </div>
        );
        i++;
        continue;
      }
      
      // Regular paragraphs - Clean any stray asterisks
      if (line.trim()) {
        let cleanLine = line.trim();
        // Remove any stray asterisks at the beginning or end
        cleanLine = cleanLine.replace(/^\*+\s*/, '').replace(/\s*\*+$/, '');
        
        elements.push(
          <div key={keyCounter++} className="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">
            {cleanLine}
          </div>
        );
      } else {
        // Empty line for spacing
        elements.push(<div key={keyCounter++} className="mb-2"></div>);
      }
      
      i++;
    }

    return elements;
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
  const [showScanDropdown, setShowScanDropdown] = useState(false);
  
  // Chat history states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Chat history management
  const CHAT_SESSIONS_KEY = 'ai_assistant_chat_sessions';

  const loadChatSessions = (): ChatSession[] => {
    try {
      const saved = localStorage.getItem(CHAT_SESSIONS_KEY);
      if (saved) {
        const sessions = JSON.parse(saved);
        // Convert date strings back to Date objects
        return sessions.map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          lastMessageAt: new Date(session.lastMessageAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      return [];
    }
  };

  const saveChatSessions = (sessions: ChatSession[]) => {
    try {
      localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving chat sessions:', error);
    }
  };

  const createNewChatSession = (scanId: string, scanUrl: string, initialMessages: Message[]): ChatSession => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: `Chat with ${scanUrl}`,
      scanId,
      scanUrl,
      messages: initialMessages,
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    
    const updatedSessions = [newSession, ...chatSessions];
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
    setCurrentSessionId(newSession.id);
    
    return newSession;
  };

  const updateCurrentSession = (newMessages: Message[]) => {
    if (!currentSessionId) return;
    
    const updatedSessions = chatSessions.map(session => 
      session.id === currentSessionId
        ? {
            ...session,
            messages: newMessages,
            lastMessageAt: new Date()
          }
        : session
    );
    
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
  };

  const loadChatSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setSelectedScanId(session.scanId);
      setMessages(session.messages);
      setIsSidebarOpen(false);
      
      // Load scan data for the session
      loadScanData(session.scanId);
    }
  };

  const deleteChatSession = (sessionId: string) => {
    const updatedSessions = chatSessions.filter(session => session.id !== sessionId);
    setChatSessions(updatedSessions);
    saveChatSessions(updatedSessions);
    
    // If we're deleting the current session, clear the chat
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
      setSelectedScanId('');
      setSelectedScanData(null);
    }
  };

  const generateSessionTitle = (messages: Message[], scanUrl?: string): string => {
    // Find the first user message to create a meaningful title
    const firstUserMessage = messages.find(msg => msg.type === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.trim();
      // Create more meaningful titles based on the content
      if (content.toLowerCase().includes('vulnerability') || content.toLowerCase().includes('vulnerabilities')) {
        return 'Vulnerability Analysis';
      } else if (content.toLowerCase().includes('remediation') || content.toLowerCase().includes('fix')) {
        return 'Remediation Guide';
      } else if (content.toLowerCase().includes('report') || content.toLowerCase().includes('summary')) {
        return 'Security Report';
      } else if (content.toLowerCase().includes('critical') || content.toLowerCase().includes('priority')) {
        return 'Critical Issues';
      } else if (content.length > 35) {
        return content.substring(0, 35) + '...';
      }
      return content;
    }
    // Fallback with scan URL if available
    if (scanUrl) {
      try {
        const url = new URL(scanUrl);
        return `Analysis: ${url.hostname}`;
      } catch {
        return 'Security Analysis';
      }
    }
    return 'New Chat';
  };

  // Load chat sessions on component mount
  useEffect(() => {
    const sessions = loadChatSessions();
    setChatSessions(sessions);
  }, []);

  // Update session messages when messages change
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      updateCurrentSession(messages);
      
      // Update session title if it's still the default
      const currentSession = chatSessions.find(s => s.id === currentSessionId);
      if (currentSession && currentSession.title.startsWith('Chat with')) {
        const newTitle = generateSessionTitle(messages, currentSession.scanUrl);
        const updatedSessions = chatSessions.map(session => 
          session.id === currentSessionId
            ? { ...session, title: newTitle }
            : session
        );
        setChatSessions(updatedSessions);
        saveChatSessions(updatedSessions);
      }
    }
  }, [messages, currentSessionId, chatSessions]);

  // Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsSidebarOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowScanDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        
        // Only add welcome message if starting a new chat (no current session)
        if (!currentSessionId) {
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
      }
    } catch (error) {
      console.error('Error loading scan data:', error);
    } finally {
      setIsLoadingScan(false);
    }
  };

  const handleScanSelect = (scanId: string) => {
    // Start a new chat session
    setCurrentSessionId(null);
    setSelectedScanId(scanId);
    setMessages([]); // Clear previous messages
    setShowScanDropdown(false); // Close dropdown after selection
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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    // Create new session if this is the first message in a new chat
    if (!currentSessionId && updatedMessages.length === 2) { // 1 welcome + 1 user message
      const scanUrl = selectedScanData?.summary?.scan_info?.target_url || 'Unknown URL';
      createNewChatSession(selectedScanId, scanUrl, updatedMessages);
    }
    
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

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);
      
      // Create session if this is the first exchange and we haven't created one yet
      if (!currentSessionId) {
        const scanUrl = selectedScanData?.summary?.scan_info?.target_url || 'Unknown URL';
        createNewChatSession(selectedScanId, scanUrl, finalMessages);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or check your API configuration.',
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
      // Create session even for errors if this is the first exchange
      if (!currentSessionId) {
        const scanUrl = selectedScanData?.summary?.scan_info?.target_url || 'Unknown URL';
        createNewChatSession(selectedScanId, scanUrl, finalMessages);
      }
      
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
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Chat History Sidebar - Collapsible */}
      <div className={`${
        isSidebarOpen ? 'w-80' : 'w-0'
      } transition-all duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0`}>
        <div className="w-80 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat History</h2>
          </div>

          {/* New Chat Button */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setCurrentSessionId(null);
                setMessages([]);
                setSelectedScanId('');
                setSelectedScanData(null);
              }}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="flex-1 text-left">New chat</span>
            </button>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {chatSessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                <div className="text-sm">Your conversations will appear here</div>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group relative flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                      currentSessionId === session.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700"
                    )}
                    onClick={() => loadChatSession(session.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "flex-shrink-0 w-2 h-2 rounded-full",
                        currentSessionId === session.id
                          ? "bg-blue-600 dark:bg-blue-400"
                          : "bg-gray-400 dark:bg-gray-600"
                      )} />
                      <MessageCircle className={cn(
                        "h-4 w-4 flex-shrink-0",
                        currentSessionId === session.id
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-500 dark:text-gray-400"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className={cn(
                          "text-sm truncate font-medium",
                          currentSessionId === session.id
                            ? "text-blue-900 dark:text-blue-100"
                            : "text-gray-900 dark:text-gray-100"
                        )}>
                          {session.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {formatTimestamp(session.lastMessageAt.toISOString())} • {session.scanUrl ? (() => {
                            try { return new URL(session.scanUrl).hostname; } catch { return 'Unknown'; }
                          })() : 'Unknown'} • {session.messages.length} messages
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChatSession(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                <Menu className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">AI Assistant</h1>
                {currentSessionId && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    Session Active
                  </span>
                )}
              </div>
            </div>
            
            {/* Current Scan Info */}
            {selectedScanData && (
              <div className="hidden sm:flex items-center gap-3 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="min-w-0">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Active Scan:</span>
                  <div className="text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                    {selectedScanData.summary?.scan_info?.target_url}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-red-500" />
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {selectedScanData.vulnerabilities?.length || 0}
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={onRefresh}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Refresh scans"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
            {!selectedScanId ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-2xl mx-auto px-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-8">
                    AI
                  </div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    How can I help you today?
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Select a security scan to start analyzing vulnerabilities and get AI-powered recommendations.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl mx-auto">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="text-lg mb-2">🔍</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Analyze Vulnerabilities</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Get detailed security analysis</div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="text-lg mb-2">🛡️</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Get Remediation</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Learn how to fix issues</div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="text-lg mb-2">📊</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Generate Reports</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Create security summaries</div>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className="text-lg mb-2">⚡</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">Best Practices</div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">Security recommendations</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : messages.length === 0 && !isLoadingScan ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-300 font-medium">Preparing AI Security Assistant...</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading scan data and initializing analysis</p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.type === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-6 py-4 shadow-sm",
                        message.type === 'user'
                          ? "bg-blue-600 dark:bg-blue-700 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                      )}
                    >
                      <MessageContent content={message.content} type={message.type} />
                      <div
                        className={cn(
                          "text-xs mt-3",
                          message.type === 'user' ? "text-blue-100 dark:text-blue-200" : "text-gray-500 dark:text-gray-400"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3 flex items-center gap-3">
                      <Loader className="h-4 w-4 animate-spin text-gray-600 dark:text-gray-400" />
                      <span className="text-gray-600 dark:text-gray-400 text-sm">AI is analyzing...</span>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="max-w-4xl mx-auto">
              {/* Quick Action Suggestions */}
              {selectedScanId && messages.length <= 1 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">💡 Try asking:</p>
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
                        className="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Input with Scan Selector */}
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={
                      selectedScanId 
                        ? "Message AI Assistant..." 
                        : "Select a scan first to start chatting..."
                    }
                    disabled={!selectedScanId || isLoading}
                    className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-300 dark:focus:border-gray-600 disabled:bg-gray-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
                  />
                </div>
                
                {/* Scan Selector Dropdown */}
                <div className="relative flex-shrink-0" ref={dropdownRef}>
                  <button
                    onClick={() => setShowScanDropdown(!showScanDropdown)}
                    className="px-3 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-600 transition-colors flex items-center gap-2 whitespace-nowrap border border-gray-200 dark:border-gray-700"
                  >
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {selectedScanId ? 'Switch' : 'Select Scan'}
                    </span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", showScanDropdown && "rotate-180")} />
                  </button>

                  {/* Dropdown Menu */}
                  {showScanDropdown && (
                    <div className="absolute bottom-full right-0 mb-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-72 overflow-hidden">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Select a Security Scan
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Choose a scan to analyze its vulnerabilities with AI
                        </p>
                      </div>
                      
                      {scans.length === 0 ? (
                        <div className="text-center py-8">
                          <FileText className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">No scans available</p>
                          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Run a security scan first</p>
                        </div>
                      ) : (
                        <div className="max-h-56 overflow-y-auto">
                          {scans.map((scan) => {
                            const { vulnerabilities, url } = getScanSummary(scan);
                            const isSelected = selectedScanId === scan.id;
                            
                            return (
                              <button
                                key={scan.id}
                                onClick={() => handleScanSelect(scan.id)}
                                className={cn(
                                  "w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0",
                                  isSelected && "bg-gray-50 dark:bg-gray-700"
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-1 truncate">
                                      {url}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {formatTimestamp(scan.timestamp)}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 ml-2">
                                    <div className="flex items-center gap-1 text-xs">
                                      <AlertTriangle className="h-3 w-3 text-red-500" />
                                      <span className="text-gray-600 dark:text-gray-400">{vulnerabilities}</span>
                                    </div>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Send Button */}
                <button
                  onClick={handleSendMessage}
                  disabled={!selectedScanId || !inputMessage.trim() || isLoading}
                  className={cn(
                    "px-4 py-3 text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors flex items-center gap-2 flex-shrink-0",
                    (!selectedScanId || !inputMessage.trim() || isLoading)
                      ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-gray-800 dark:bg-gray-700 hover:bg-gray-900 dark:hover:bg-gray-600 focus:ring-gray-800 dark:focus:ring-gray-600"
                  )}
                >
                  {isLoading ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
              
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                AI Assistant can make mistakes. Check important info.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
