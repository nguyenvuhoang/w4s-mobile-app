import CustomText from '@/components/base/CustomText';
import { useAppTheme } from '@/core/theme/ThemeContext';
import { Fonts } from '@/core/theme/font';
import { hp, normalize, wp } from '@/utils/layout';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// 🔥 MOCK STREAM HOOK
import { useChatStreamMock } from '@/features/ai-chat/hooks/useChatStream.mock';

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
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const { startStream, stopStream } = useChatStreamMock();

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    });
  };

  const handleSend = () => {
    if (!inputText.trim() || isProcessing || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    scrollToBottom();

    const aiMessageId = (Date.now() + 1).toString();

    // 🔥 STREAM MOCK với processing delay
    startStream({
      onProcessing: (processing) => {
        setIsProcessing(processing);
        if (!processing) {
          // Chỉ tạo message AI khi bắt đầu stream
          setMessages((prev) => [
            ...prev,
            {
              id: aiMessageId,
              text: '',
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setIsStreaming(true);
          scrollToBottom();
        }
      },
      onMessage: (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        );
        scrollToBottom();
      },
      onDone: () => {
        setIsProcessing(false);
        setIsStreaming(false);
        scrollToBottom();
      },
      processingDelay: 1500, // 1.5 giây delay "đang xử lý"
    });
  };

  const handleCopyMessage = async (text: string) => {
    await Clipboard.setStringAsync(text);
    console.log('Copied:', text);
  };

  const handleSuggestionPress = (text: string) => {
    if (isProcessing || isStreaming) return;

    setInputText(text);

    // Tự động gửi tin nhắn
    const userMessage: Message = {
      id: Date.now().toString(),
      text: text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages([userMessage]);
    setInputText('');
    scrollToBottom();

    const aiMessageId = (Date.now() + 1).toString();

    startStream({
      onProcessing: (processing) => {
        setIsProcessing(processing);
        if (!processing) {
          setMessages((prev) => [
            ...prev,
            {
              id: aiMessageId,
              text: '',
              isUser: false,
              timestamp: new Date(),
            },
          ]);
          setIsStreaming(true);
          scrollToBottom();
        }
      },
      onMessage: (chunk) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMessageId
              ? { ...msg, text: msg.text + chunk }
              : msg
          )
        );
        scrollToBottom();
      },
      onDone: () => {
        setIsProcessing(false);
        setIsStreaming(false);
        scrollToBottom();
      },
      processingDelay: 1500,
    });
  };

  const renderMessage = (item: Message) => {
    if (item.isUser) {
      return (
        <View style={styles.userMessageContainer}>
          <View
            style={[
              styles.userMessageBubble,
              { backgroundColor: colors.card },
            ]}
          >
            <CustomText style={[styles.messageText, { color: colors.text }]}>
              {item.text}
            </CustomText>
          </View>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopyMessage(item.text)}
          >
            <Ionicons
              name="copy-outline"
              size={normalize(20)}
              color={colors.icon}
            />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.aiMessageContainer}>
        <View
          style={[
            styles.aiMessageBubble,
            { backgroundColor: colors.tint + '15' },
          ]}
        >
          <CustomText style={[styles.messageText, { color: colors.text }]}>
            {item.text}
          </CustomText>
        </View>
        {item.text && (
          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => handleCopyMessage(item.text)}
          >
            <Ionicons
              name="copy-outline"
              size={normalize(20)}
              color={colors.icon}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={normalize(24)}
              color={colors.text}
            />
          </TouchableOpacity>
          <CustomText style={[styles.headerTitle, { color: colors.text }]}>
            Chatbot AI
          </CustomText>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push('/(protected)/ai-chat/history')}
          >
            <Ionicons
              name="chatbubbles-outline"
              size={normalize(24)}
              color={colors.text}
            />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[
            styles.messagesContent,
            messages.length === 0 && styles.messagesContentEmpty,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            // Welcome Screen
            <View style={styles.emptyContainer}>
              <View style={[styles.aiIconContainer, { backgroundColor: colors.tint + '20' }]}>
                <Ionicons
                  name="sparkles"
                  size={normalize(48)}
                  color={colors.tint}
                />
              </View>
              <CustomText style={[styles.emptyTitle, { color: colors.text }]}>
                Xin chào! 👋
              </CustomText>
              <CustomText style={[styles.emptySubtitle, { color: colors.icon }]}>
                Tôi là trợ lý AI của bạn. Hãy hỏi tôi bất cứ điều gì!
              </CustomText>

              {/* Suggestion Cards */}
              <View style={styles.suggestionsContainer}>
                <TouchableOpacity
                  style={[styles.suggestionCard, { backgroundColor: colors.card }]}
                  onPress={() => handleSuggestionPress('Cách tạo ví trong W4S như thế nào?')}
                  activeOpacity={0.7}
                  disabled={isProcessing || isStreaming}
                >
                  <Ionicons name="wallet-outline" size={normalize(24)} color={colors.tint} />
                  <CustomText style={[styles.suggestionText, { color: colors.text }]}>
                    Cách tạo ví
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.suggestionCard, { backgroundColor: colors.card }]}
                  onPress={() => handleSuggestionPress('Hướng dẫn tạo giao dịch thu chi')}
                  activeOpacity={0.7}
                  disabled={isProcessing || isStreaming}
                >
                  <Ionicons name="swap-horizontal-outline" size={normalize(24)} color={colors.tint} />
                  <CustomText style={[styles.suggestionText, { color: colors.text }]}>
                    Tạo giao dịch
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.suggestionCard, { backgroundColor: colors.card }]}
                  onPress={() => handleSuggestionPress('Cách quản lý ngân sách hiệu quả')}
                  activeOpacity={0.7}
                  disabled={isProcessing || isStreaming}
                >
                  <Ionicons name="pie-chart-outline" size={normalize(24)} color={colors.tint} />
                  <CustomText style={[styles.suggestionText, { color: colors.text }]}>
                    Quản lý ngân sách
                  </CustomText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.suggestionCard, { backgroundColor: colors.card }]}
                  onPress={() => handleSuggestionPress('Mẹo tiết kiệm tiền cho sinh viên')}
                  activeOpacity={0.7}
                  disabled={isProcessing || isStreaming}
                >
                  <Ionicons name="trending-up-outline" size={normalize(24)} color={colors.tint} />
                  <CustomText style={[styles.suggestionText, { color: colors.text }]}>
                    Mẹo tiết kiệm
                  </CustomText>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // Messages List
            <>
              {messages.map((msg) => (
                <View key={msg.id}>{renderMessage(msg)}</View>
              ))}

              {/* Processing Indicator */}
              {isProcessing && (
                <View style={styles.typingContainer}>
                  <View
                    style={[
                      styles.typingBubble,
                      { backgroundColor: colors.tint + '15' },
                    ]}
                  >
                    <ActivityIndicator size="small" color={colors.tint} />
                    <CustomText
                      style={[styles.typingText, { color: colors.text }]}
                    >
                      Đang xử lý...
                    </CustomText>
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: hp(2) }} />
        </ScrollView>

        {/* Input */}
        <View
          style={[styles.inputContainer, { backgroundColor: colors.background }]}
        >
          <View style={[styles.inputWrapper, { backgroundColor: colors.card }]}>
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Hãy cho tôi biết ...."
              placeholderTextColor={colors.icon}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isProcessing && !isStreaming}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: colors.tint },
              (!inputText.trim() || isProcessing || isStreaming) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isProcessing || isStreaming}
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

  messagesContainer: { flex: 1 },
  messagesContent: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  messagesContentEmpty: {
    flexGrow: 1,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(5),
    gap: normalize(16),
  },
  aiIconContainer: {
    width: normalize(100),
    height: normalize(100),
    borderRadius: normalize(50),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: normalize(8),
  },
  emptyTitle: {
    fontSize: normalize(24),
    fontFamily: Fonts.bold,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: normalize(15),
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: normalize(22),
    paddingHorizontal: wp(10),
  },
  suggestionsContainer: {
    width: '100%',
    gap: normalize(12),
    marginTop: normalize(16),
  },
  suggestionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(12),
    padding: normalize(16),
    borderRadius: normalize(16),
  },
  suggestionText: {
    fontSize: normalize(15),
    fontFamily: Fonts.medium,
    flex: 1,
  },

  userMessageContainer: {
    flexDirection: 'row',
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

  aiMessageContainer: {
    flexDirection: 'row',
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

  typingContainer: {
    flexDirection: 'row',
    marginBottom: hp(2),
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: normalize(8),
    padding: normalize(12),
    paddingHorizontal: normalize(16),
    borderRadius: normalize(20),
    borderTopLeftRadius: normalize(4),
  },
  typingText: {
    fontSize: normalize(14),
    fontFamily: Fonts.regular,
  },

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