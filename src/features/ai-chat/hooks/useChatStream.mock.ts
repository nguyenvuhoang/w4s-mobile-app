import { useEffect, useRef } from 'react';

interface MockChatStreamOptions {
  onMessage: (chunk: string) => void;
  onDone?: () => void;
  onProcessing?: (isProcessing: boolean) => void;
  processingDelay?: number; // milliseconds
}

const MOCK_TEXT =
  'Xin chào 👋 Tôi là trợ lý AI của ứng dụng. ' +
  'Ở thời điểm hiện tại, tôi chưa thể tra cứu thông tin hay trả lời đầy đủ các câu hỏi, ' +
  'nhưng hệ thống đã sẵn sàng về mặt trải nghiệm để bạn hình dung cách tôi sẽ hỗ trợ ' +
  'trong giai đoạn tiếp theo của sản phẩm.';


export function useChatStreamMock() {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const processingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const indexRef = useRef(0);

  const startStream = ({ 
    onMessage, 
    onDone, 
    onProcessing,
    processingDelay = 1500 // default 1.5 giây
  }: MockChatStreamOptions) => {
    stopStream();

    indexRef.current = 0;

    // Bắt đầu trạng thái "đang xử lý"
    onProcessing?.(true);

    // Delay một chút trước khi bắt đầu stream
    processingTimerRef.current = setTimeout(() => {
      onProcessing?.(false);

      // Bắt đầu stream text
      timerRef.current = setInterval(() => {
        if (indexRef.current >= MOCK_TEXT.length) {
          stopStream();
          onDone?.();
          return;
        }
        const char = MOCK_TEXT[indexRef.current];
        indexRef.current += 1;
        onMessage(char);
      }, 20);
    }, processingDelay);
  };

  const stopStream = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (processingTimerRef.current) {
      clearTimeout(processingTimerRef.current);
      processingTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopStream();
  }, []);

  return {
    startStream,
    stopStream,
  };
}