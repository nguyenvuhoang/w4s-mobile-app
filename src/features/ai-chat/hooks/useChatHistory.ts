import { useState, useCallback } from 'react';
import StorageKey from '@/constants/StorageKey';
import StorageService from '@/services/StorageService';

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string; // ISO String to avoid serialization issues
}

export interface ChatSession {
  id: string;
  title: string;
  summary: string;
  lastMessage: string;
  timestamp: string; // ISO string
  messages: Message[];
}

export const useChatHistory = () => {
  const [chatList, setChatList] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    try {
      const dataStr = await StorageService.getItem(StorageKey.chatHistory);
      if (dataStr) {
        const parsed = JSON.parse(dataStr) as ChatSession[];
        // Sort by timestamp desc
        parsed.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setChatList(parsed);
        return parsed;
      }
      setChatList([]);
      return [];
    } catch (error) {
      console.error('[useChatHistory] loadHistory error:', error);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const saveHistory = async (newList: ChatSession[]) => {
    try {
      // Sort before saving
      newList.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      await StorageService.setItem(StorageKey.chatHistory, JSON.stringify(newList));
      setChatList(newList);
    } catch (error) {
      console.error('[useChatHistory] saveHistory error:', error);
    }
  };

  const getChat = useCallback(
    async (chatId: string): Promise<ChatSession | null> => {
      try {
        const history = await loadHistory();
        return history.find((c) => c.id === chatId) || null;
      } catch (error) {
        console.error('[useChatHistory] getChat error:', error);
        return null;
      }
    },
    [loadHistory]
  );

  const saveMessage = useCallback(
    async (chatId: string, message: Message) => {
      try {
        const currentList = await loadHistory();
        let sessionIndex = currentList.findIndex((s) => s.id === chatId);
        let updatedList = [...currentList];

        const timestampStr = new Date().toISOString();

        if (sessionIndex > -1) {
          // Update existing session
          const session = { ...updatedList[sessionIndex] };
          
          // Check if message already exists (to avoid duplicate additions)
          const msgIndex = session.messages.findIndex((m) => m.id === message.id);
          let updatedMessages = [...session.messages];
          
          if (msgIndex > -1) {
            updatedMessages[msgIndex] = message;
          } else {
            updatedMessages.push(message);
          }

          // If the message is the first message or if title is generic, update it
          let title = session.title;
          let summary = session.summary;
          if (updatedMessages.filter(m => m.isUser).length === 1 && message.isUser) {
            const cleanText = message.text.trim();
            title = cleanText.length > 25 ? cleanText.substring(0, 25) + '...' : cleanText;
            summary = cleanText.length > 80 ? cleanText.substring(0, 80) + '...' : cleanText;
          }

          session.messages = updatedMessages;
          session.lastMessage = message.text;
          session.timestamp = timestampStr;
          session.title = title;
          session.summary = summary;

          updatedList[sessionIndex] = session;
        } else {
          // Create new session if it doesn't exist
          let title = 'New Conversation';
          let summary = 'Conversation summary...';

          if (message.isUser) {
            const cleanText = message.text.trim();
            title = cleanText.length > 25 ? cleanText.substring(0, 25) + '...' : cleanText;
            summary = cleanText.length > 80 ? cleanText.substring(0, 80) + '...' : cleanText;
          }

          const newSession: ChatSession = {
            id: chatId,
            title,
            summary,
            lastMessage: message.text,
            timestamp: timestampStr,
            messages: [message],
          };
          updatedList.push(newSession);
        }

        await saveHistory(updatedList);
      } catch (error) {
        console.error('[useChatHistory] saveMessage error:', error);
      }
    },
    [loadHistory]
  );

  const createChat = useCallback(async (chatId: string) => {
    try {
      const currentList = await loadHistory();
      const exists = currentList.some((s) => s.id === chatId);
      if (exists) return;

      const newSession: ChatSession = {
        id: chatId,
        title: 'New Conversation',
        summary: 'Conversation summary...',
        lastMessage: '',
        timestamp: new Date().toISOString(),
        messages: [],
      };

      const updatedList = [...currentList, newSession];
      await saveHistory(updatedList);
    } catch (error) {
      console.error('[useChatHistory] createChat error:', error);
    }
  }, [loadHistory]);

  const deleteChat = useCallback(
    async (chatId: string) => {
      try {
        const currentList = await loadHistory();
        const filteredList = currentList.filter((s) => s.id !== chatId);
        await saveHistory(filteredList);
      } catch (error) {
        console.error('[useChatHistory] deleteChat error:', error);
      }
    },
    [loadHistory]
  );

  const renameChat = useCallback(
    async (chatId: string, newTitle: string) => {
      try {
        const currentList = await loadHistory();
        const sessionIndex = currentList.findIndex((s) => s.id === chatId);
        if (sessionIndex > -1) {
          const updatedList = [...currentList];
          updatedList[sessionIndex] = {
            ...updatedList[sessionIndex],
            title: newTitle,
          };
          await saveHistory(updatedList);
        }
      } catch (error) {
        console.error('[useChatHistory] renameChat error:', error);
      }
    },
    [loadHistory]
  );

  return {
    chatList,
    loading,
    loadHistory,
    getChat,
    createChat,
    saveMessage,
    deleteChat,
    renameChat,
  };
};
