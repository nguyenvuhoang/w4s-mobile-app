// src/features/ai-chat/screens/AIChatScreen.tsx

import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AIChatScreen = () => {
  const { colors } = useAppTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // TODO: Call AI API here
    try {
      // Simulate AI response
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Đây là câu trả lời mẫu từ AI. Bạn cần tích hợp API thực tế ở đây.',
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleCopyMessage = async (text: string) => {
    await Clipboard.setStringAsync(text);
    // TODO: Show toast "Đã copy"
    console.log('Copied:', text);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View style={[styles.userMessageBubble, { backgroundColor: colors.card }]}>
            <CustomText style={[styles.messageText, { color: colors.text }]}>
              {item.text}
            </CustomText>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopyMessage(item.text)}
          >
            <Ionicons name="copy-outline" size={normalize(20)} color={colors.icon} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.aiMessageContainer}>
        <View style={[styles.aiMessageBubble, { backgroundColor: colors.tint + '15' }]}>
          <CustomText style={[styles.messageText, { color: colors.text }]}>
            {item.text}
          </CustomText>
        </View>
        <TouchableOpacity
          style={styles.copyButton}
          onPress={() => handleCopyMessage(item.text)}
        >
          <Ionicons name="copy-outline" size={normalize(20)} color={colors.icon} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={normalize(24)} color={colors.text} />
          </TouchableOpacity>
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            Chatbot AI
          </CustomText>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/(protected)/ai-chat/history')}
          >
            <Ionicons name="chatbubbles-outline" size={normalize(24)} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id}>
              {renderMessage({ item: message })}
            </View>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={[styles.typingBubble, { backgroundColor: colors.card }]}>
                <ActivityIndicator size="small" color={colors.tint} />
                <CustomText style={[styles.typingText, { color: colors.icon }]}>
                  Đang suy nghĩ ....
                </CustomText>
              </View>
            </View>
          )}

          <View style={{ height: hp(2) }} />
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Hãy cho tôi biết ...."
              placeholderTextColor={colors.icon}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.tint },
              !inputText.trim() && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={normalize(20)} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: normalize(18),
    fontFamily: Fonts.semiBold,
  },
  historyButton: {
    width: normalize(40),
    height: normalize(40),
    borderRadius: normalize(20),
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },

  // User Message
  userMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginBottom: hp(2),
    gap: normalize(8),
  },
  userMessageBubble: {
    maxWidth: '80%',
    padding: normalize(16),
    borderRadius: normalize(20),
    borderTopRightRadius: normalize(4),
  },

  // AI Message
  aiMessageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    marginBottom: hp(2),
    gap: normalize(8),
  },
  aiMessageBubble: {
    maxWidth: '80%',
    padding: normalize(16),
    borderRadius: normalize(20),
    borderTopLeftRadius: normalize(4),
  },

  messageText: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    lineHeight: normalize(22),
  },

  copyButton: {
    width: normalize(32),
    height: normalize(32),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: normalize(4),
  },

  // Typing
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(2),
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    padding: normalize(12),
    borderRadius: normalize(20),
    borderTopLeftRadius: normalize(4),
  },
  typingText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    gap: normalize(12),
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  inputWrapper: {
    flex: 1,
    borderRadius: normalize(24),
    paddingHorizontal: normalize(16),
    paddingVertical: normalize(5),
    minHeight: normalize(40),
    maxHeight: normalize(100),
  },
  input: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    lineHeight: normalize(20),
  },
  sendButton: {
    width: normalize(48),
    height: normalize(48),
    borderRadius: normalize(24),
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default AIChatScreen;