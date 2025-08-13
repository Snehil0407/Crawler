interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  provider?: 'email' | 'google';
  createdAt?: Date;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  scanId: string;
  scanUrl: string;
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  userId?: string; // For user-specific storage
}

export interface ConversationStorage {
  sessions: ChatSession[];
  lastSyncTime: Date;
}

class ConversationService {
  private readonly STORAGE_KEY = 'ai_assistant_chat_sessions';
  private readonly STORAGE_VERSION = '1.0';
  private currentUser: User | null = null;

  constructor() {
    // Initialize with any existing data
    this.migrateOldData();
  }

  setCurrentUser(user: User | null) {
    this.currentUser = user;
  }

  private getUserStorageKey(): string {
    if (this.currentUser) {
      return `${this.STORAGE_KEY}_${this.currentUser.id}`;
    }
    return this.STORAGE_KEY; // Fallback to general storage for non-authenticated users
  }

  private migrateOldData() {
    try {
      // Check if there's old data in the old format and migrate it
      const oldData = localStorage.getItem('ai_assistant_chat_sessions');
      if (oldData && !localStorage.getItem(this.STORAGE_KEY)) {
        const oldSessions = JSON.parse(oldData);
        const migratedData: ConversationStorage = {
          sessions: oldSessions.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            lastMessageAt: new Date(session.lastMessageAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          })),
          lastSyncTime: new Date()
        };
        this.saveToStorage(migratedData);
        // Remove old data after migration
        localStorage.removeItem('ai_assistant_chat_sessions');
      }
    } catch (error) {
      console.error('Error migrating old conversation data:', error);
    }
  }

  private loadFromStorage(): ConversationStorage {
    try {
      const storageKey = this.getUserStorageKey();
      const saved = localStorage.getItem(storageKey);
      
      if (saved) {
        const data = JSON.parse(saved);
        
        // Convert date strings back to Date objects
        return {
          sessions: data.sessions.map((session: any) => ({
            ...session,
            createdAt: new Date(session.createdAt),
            lastMessageAt: new Date(session.lastMessageAt),
            messages: session.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          })),
          lastSyncTime: new Date(data.lastSyncTime)
        };
      }
      
      return {
        sessions: [],
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('Error loading conversation data:', error);
      return {
        sessions: [],
        lastSyncTime: new Date()
      };
    }
  }

  private saveToStorage(data: ConversationStorage) {
    try {
      const storageKey = this.getUserStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving conversation data:', error);
      // Handle storage quota exceeded
      if (error instanceof DOMException && error.code === 22) {
        console.warn('Storage quota exceeded, cleaning up old conversations...');
        this.cleanupOldConversations(data);
      }
    }
  }

  private cleanupOldConversations(data: ConversationStorage) {
    try {
      // Keep only the 50 most recent conversations
      const sortedSessions = data.sessions
        .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime())
        .slice(0, 50);
      
      const cleanedData: ConversationStorage = {
        sessions: sortedSessions,
        lastSyncTime: new Date()
      };
      
      this.saveToStorage(cleanedData);
    } catch (error) {
      console.error('Error cleaning up conversations:', error);
    }
  }

  loadChatSessions(): ChatSession[] {
    const data = this.loadFromStorage();
    return data.sessions.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  saveChatSessions(sessions: ChatSession[]) {
    const data: ConversationStorage = {
      sessions,
      lastSyncTime: new Date()
    };
    this.saveToStorage(data);
  }

  createNewSession(scanId: string, scanUrl: string, initialMessages: Message[] = []): ChatSession {
    const newSession: ChatSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateSessionTitle(initialMessages, scanUrl),
      scanId,
      scanUrl,
      messages: initialMessages,
      createdAt: new Date(),
      lastMessageAt: new Date(),
      userId: this.currentUser?.id
    };

    const existingSessions = this.loadChatSessions();
    const updatedSessions = [newSession, ...existingSessions];
    this.saveChatSessions(updatedSessions);

    return newSession;
  }

  updateSession(sessionId: string, updates: Partial<ChatSession>): ChatSession | null {
    const sessions = this.loadChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      return null;
    }

    const updatedSession = {
      ...sessions[sessionIndex],
      ...updates,
      lastMessageAt: new Date()
    };

    sessions[sessionIndex] = updatedSession;
    this.saveChatSessions(sessions);

    return updatedSession;
  }

  addMessageToSession(sessionId: string, message: Message): ChatSession | null {
    const sessions = this.loadChatSessions();
    const sessionIndex = sessions.findIndex(s => s.id === sessionId);

    if (sessionIndex === -1) {
      return null;
    }

    const updatedSession = {
      ...sessions[sessionIndex],
      messages: [...sessions[sessionIndex].messages, message],
      lastMessageAt: new Date()
    };

    // Update title if it's still default and we have enough context
    if (updatedSession.title.startsWith('Chat with') || updatedSession.title === 'New Chat') {
      updatedSession.title = this.generateSessionTitle(updatedSession.messages, updatedSession.scanUrl);
    }

    sessions[sessionIndex] = updatedSession;
    this.saveChatSessions(sessions);

    return updatedSession;
  }

  deleteSession(sessionId: string): boolean {
    const sessions = this.loadChatSessions();
    const filteredSessions = sessions.filter(session => session.id !== sessionId);

    if (filteredSessions.length === sessions.length) {
      return false; // Session not found
    }

    this.saveChatSessions(filteredSessions);
    return true;
  }

  getSession(sessionId: string): ChatSession | null {
    const sessions = this.loadChatSessions();
    return sessions.find(s => s.id === sessionId) || null;
  }

  searchSessions(query: string): ChatSession[] {
    const sessions = this.loadChatSessions();
    const lowerQuery = query.toLowerCase();

    return sessions.filter(session => 
      session.title.toLowerCase().includes(lowerQuery) ||
      session.scanUrl.toLowerCase().includes(lowerQuery) ||
      session.messages.some(msg => 
        msg.content.toLowerCase().includes(lowerQuery)
      )
    );
  }

  private generateSessionTitle(messages: Message[], scanUrl?: string): string {
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
      } else if (content.toLowerCase().includes('sql injection') || content.toLowerCase().includes('sqli')) {
        return 'SQL Injection Analysis';
      } else if (content.toLowerCase().includes('xss') || content.toLowerCase().includes('cross-site scripting')) {
        return 'XSS Analysis';
      } else if (content.toLowerCase().includes('csrf') || content.toLowerCase().includes('cross-site request forgery')) {
        return 'CSRF Analysis';
      } else if (content.toLowerCase().includes('owasp')) {
        return 'OWASP Security Review';
      } else if (content.length > 40) {
        return content.substring(0, 40) + '...';
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
  }

  exportSessions(): string {
    const data = this.loadFromStorage();
    return JSON.stringify(data, null, 2);
  }

  importSessions(jsonData: string): boolean {
    try {
      const importedData = JSON.parse(jsonData);
      
      // Validate the data structure
      if (!importedData.sessions || !Array.isArray(importedData.sessions)) {
        throw new Error('Invalid data format');
      }

      // Convert dates and merge with existing sessions
      const existingSessions = this.loadChatSessions();
      const importedSessions = importedData.sessions.map((session: any) => ({
        ...session,
        id: `imported_${Date.now()}_${session.id}`, // Avoid ID conflicts
        createdAt: new Date(session.createdAt),
        lastMessageAt: new Date(session.lastMessageAt),
        messages: session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));

      const mergedSessions = [...importedSessions, ...existingSessions];
      this.saveChatSessions(mergedSessions);

      return true;
    } catch (error) {
      console.error('Error importing sessions:', error);
      return false;
    }
  }

  getSessionsStats(): {
    totalSessions: number;
    totalMessages: number;
    oldestSession: Date | null;
    newestSession: Date | null;
  } {
    const sessions = this.loadChatSessions();
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalMessages: 0,
        oldestSession: null,
        newestSession: null
      };
    }

    const totalMessages = sessions.reduce((sum, session) => sum + session.messages.length, 0);
    const dates = sessions.map(s => s.createdAt);
    
    return {
      totalSessions: sessions.length,
      totalMessages,
      oldestSession: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestSession: new Date(Math.max(...dates.map(d => d.getTime())))
    };
  }
}

// Export singleton instance
export const conversationService = new ConversationService();
export default conversationService;
