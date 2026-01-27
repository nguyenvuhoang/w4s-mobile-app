// src/features/ai-chat/screens/AIChatHistoryScreen.tsx

import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatHistory {
  id: string;
  title: string;
  summary: string;
  lastMessage: string;
  timestamp: Date;
}

const AIChatHistoryScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();

  // Mock data - Replace with real data from API
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([
    {
      id: '1',
      title: 'Tiêu đề cuộc trò chuyện ....',
      summary: 'Tóm tắt nội dung cuộc trò chuyện được hệ thống tự động sinh ra ....',
      lastMessage: 'Hãy thống kê 3 tháng gần nhất',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      title: 'Tiêu đề cuộc trò chuyện ....',
      summary: 'Tóm tắt nội dung cuộc trò chuyện được hệ thống tự động sinh ra ....',
      lastMessage: 'Chi tiêu tháng này như thế nào?',
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      title: 'Tiêu đề cuộc trò chuyện ....',
      summary: 'Tóm tắt nội dung cuộc trò chuyện được hệ thống tự động sinh ra ....',
      lastMessage: 'Phân tích chi tiêu',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ]);

  const handleNewChat = () => {
    router.push('/(protected)/ai-chat');
  };

  const handleOpenChat = (chatId: string) => {
    router.push({
      pathname: '/(protected)/ai-chat',
      params: { chatId },
    });
  };

  const handleDeleteChat = (chatId: string) => {
    Alert.alert(
      t('ai_chat.delete_chat_title'),
      t('ai_chat.delete_chat_message'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            setChatHistory((prev) => prev.filter((chat) => chat.id !== chatId));
            // TODO: Call API to delete chat
          },
        },
      ]
    );
  };

  const handleRenameChat = (chatId: string) => {
    // TODO: Show rename modal
    showNotification(t('common.feature_developing'), 'warning');
  };

  const renderChatItem = ({ item }: { item: ChatHistory }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colors.card }]}
      onPress={() => handleOpenChat(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.chatContent}>
        <CustomText
          style={[styles.chatTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {item.title}
        </CustomText>
        <CustomText
          style={[styles.chatSummary, { color: colors.icon }]}
          numberOfLines={2}
        >
          {item.summary}
        </CustomText>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => showMenu(item.id)}
      >
        <Ionicons name="ellipsis-vertical" size={normalize(20)} color={colors.icon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const showMenu = (chatId: string) => {
    Alert.alert(
      t('ai_chat.options'),
      t('common.select_action'),
      [
        {
          text: t('ai_chat.rename_chat'),
          onPress: () => handleRenameChat(chatId),
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => handleDeleteChat(chatId),
        },
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('ai_chat.chat_history')} showBackButton />

      <FlatList
        data={chatHistory}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="chatbubbles-outline"
              size={normalize(64)}
              color={colors.icon}
              style={{ opacity: 0.3 }}
            />
            <CustomText style={[styles.emptyText, { color: colors.icon }]}>
              {t('ai_chat.no_chats')}
            </CustomText>
          </View>
        }
      />

      {/* New Chat Button */}
      <View style={[styles.bottomContainer, { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.newChatButton, { backgroundColor: colors.tint }]}
          onPress={handleNewChat}
        >
          <CustomText style={styles.newChatButtonText}>
            {t('ai_chat.new_chat')}
          </CustomText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // List
  listContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(10),
  },

  // Chat Item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: normalize(16),
    borderRadius: normalize(16),
    marginBottom: hp(1.5),
  },
  chatContent: {
    flex: 1,
    gap: normalize(8),
  },
  chatTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    lineHeight: normalize(22),
  },
  chatSummary: {
    fontSize: normalize(13),
    fontFamily: Fonts.regular,
    lineHeight: normalize(18),
  },
  menuButton: {
    width: normalize(32),
    height: normalize(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: normalize(8),
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(10),
    gap: normalize(16),
  },
  emptyText: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
  },

  // Bottom Button
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  newChatButton: {
    paddingVertical: normalize(16),
    borderRadius: normalize(16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButtonText: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    color: '#fff',
  },
});

export default AIChatHistoryScreen;