// src/features/ai-chat/screens/AIChatHistoryScreen.tsx

import AppHeader from '@/components/base/AppHeader';
import CustomText from '@/components/base/CustomText';
import { useNotification } from '@/contexts/NotificationContext';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  View,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatHistory, ChatSession } from '../hooks/useChatHistory';

const AIChatHistoryScreen = () => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const { chatList, loadHistory, deleteChat, renameChat } = useChatHistory();

  // Modal rename state
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  // Fetch history when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

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
          onPress: async () => {
            await deleteChat(chatId);
            showNotification(t('common.success'), 'success');
          },
        },
      ]
    );
  };

  const handleRenameChat = (chatId: string, currentTitle: string) => {
    setSelectedChatId(chatId);
    setNewTitle(currentTitle);
    setIsRenameModalVisible(true);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderChatItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={[styles.chatItem, { backgroundColor: colors.card }]}
      onPress={() => handleOpenChat(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.chatContent}>
        <View style={styles.titleRow}>
          <CustomText
            style={[styles.chatTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </CustomText>
          <CustomText style={[styles.chatTime, { color: colors.icon }]}>
            {formatTime(item.timestamp)}
          </CustomText>
        </View>
        <CustomText
          style={[styles.chatSummary, { color: colors.icon }]}
          numberOfLines={2}
        >
          {item.summary || t('ai_chat.no_chats')}
        </CustomText>
      </View>

      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => showMenu(item.id, item.title)}
      >
        <Ionicons name="ellipsis-vertical" size={normalize(20)} color={colors.icon} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const showMenu = (chatId: string, currentTitle: string) => {
    Alert.alert(
      t('ai_chat.options'),
      t('common.select_action'),
      [
        {
          text: t('ai_chat.rename_chat'),
          onPress: () => handleRenameChat(chatId, currentTitle),
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
        data={chatList}
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

      {/* Rename Dialog Modal */}
      <Modal
        visible={isRenameModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.modalTitle, { color: colors.text }]}>
              {t('ai_chat.rename_chat')}
            </CustomText>
            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.border }]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title..."
              placeholderTextColor={colors.icon}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setIsRenameModalVisible(false)}
              >
                <CustomText style={{ color: colors.text }}>
                  {t('common.cancel')}
                </CustomText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={async () => {
                  if (selectedChatId && newTitle.trim()) {
                    await renameChat(selectedChatId, newTitle.trim());
                    setIsRenameModalVisible(false);
                    showNotification(t('common.success'), 'success');
                  }
                }}
              >
                <CustomText style={{ color: '#fff', fontFamily: Fonts.semiBold }}>
                  {t('common.confirm')}
                </CustomText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    gap: normalize(4),
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: normalize(12),
  },
  chatTitle: {
    fontSize: normalize(16),
    fontFamily: Fonts.semiBold,
    lineHeight: normalize(22),
    flex: 1,
  },
  chatTime: {
    fontSize: normalize(12),
    fontFamily: Fonts.regular,
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

  // Modal rename styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    padding: normalize(20),
    borderRadius: normalize(16),
    gap: normalize(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: normalize(12),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(12),
    fontSize: normalize(16),
    fontFamily: Fonts.regular,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: normalize(12),
    marginTop: normalize(8),
  },
  modalButton: {
    paddingHorizontal: normalize(20),
    paddingVertical: normalize(12),
    borderRadius: normalize(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AIChatHistoryScreen;