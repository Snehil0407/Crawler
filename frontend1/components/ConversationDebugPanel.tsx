import React, { useState, useEffect } from 'react';
import { conversationService } from '../lib/conversationService';
import { FileText, Download, Upload, Trash2, Search, MessageCircle } from 'lucide-react';

interface ConversationDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConversationDebugPanel: React.FC<ConversationDebugPanelProps> = ({ isOpen, onClose }) => {
  const [sessions, setSessions] = useState(conversationService.loadChatSessions());
  const [stats, setStats] = useState(conversationService.getSessionsStats());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const loadedSessions = conversationService.loadChatSessions();
      const loadedStats = conversationService.getSessionsStats();
      setSessions(loadedSessions);
      setStats(loadedStats);
    }
  }, [isOpen]);

  const handleExport = () => {
    const exportData = conversationService.exportSessions();
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chat-conversations-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = conversationService.importSessions(content);
      if (success) {
        setSessions(conversationService.loadChatSessions());
        setStats(conversationService.getSessionsStats());
        alert('Conversations imported successfully!');
      } else {
        alert('Failed to import conversations. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleDeleteAll = () => {
    if (confirm('Are you sure you want to delete all conversations? This cannot be undone.')) {
      conversationService.saveChatSessions([]);
      setSessions([]);
      setStats(conversationService.getSessionsStats());
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (confirm('Are you sure you want to delete this conversation?')) {
      conversationService.deleteSession(sessionId);
      setSessions(conversationService.loadChatSessions());
      setStats(conversationService.getSessionsStats());
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.scanUrl.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Conversation Debug Panel
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalSessions}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.totalMessages}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Messages</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                {stats.oldestSession ? stats.oldestSession.toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Oldest Session</div>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
              <div className="text-sm font-bold text-orange-600 dark:text-orange-400">
                {stats.newestSession ? stats.newestSession.toLocaleDateString() : 'N/A'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Newest Session</div>
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <label className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm cursor-pointer">
              <Upload className="h-4 w-4" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
            >
              <Trash2 className="h-4 w-4" />
              Delete All
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-2">
              {filteredSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No conversations match your search.' : 'No conversations found.'}
                </div>
              ) : (
                filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900 dark:text-white truncate">
                            {session.title}
                          </h3>
                          <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-1 rounded-full text-gray-600 dark:text-gray-300">
                            {session.messages.length} msgs
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                          {session.scanUrl}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Created: {session.createdAt.toLocaleString()} | 
                          Last: {session.lastMessageAt.toLocaleString()}
                        </p>
                        {selectedSession === session.id && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-600 rounded text-xs">
                            <div className="font-medium mb-1">Session Details:</div>
                            <div>ID: {session.id}</div>
                            <div>Scan ID: {session.scanId}</div>
                            <div>User ID: {session.userId || 'Anonymous'}</div>
                            <div className="mt-1">
                              <div className="font-medium">Messages:</div>
                              {session.messages.slice(0, 3).map((msg, idx) => (
                                <div key={idx} className="ml-2">
                                  {msg.type}: {msg.content.substring(0, 50)}...
                                </div>
                              ))}
                              {session.messages.length > 3 && (
                                <div className="ml-2 text-gray-400">
                                  ... and {session.messages.length - 3} more messages
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => setSelectedSession(
                            selectedSession === session.id ? null : session.id
                          )}
                          className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSession(session.id)}
                          className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationDebugPanel;
