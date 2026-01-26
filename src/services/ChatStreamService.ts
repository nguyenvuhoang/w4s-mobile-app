// services/ChatStreamService.ts
import { ChatStreamOptions } from '@/core/api/models/ClientModel';
import SSE from 'react-native-sse';

export const ChatStreamService = {
  start(options: ChatStreamOptions) {
    const {
      url,
      token,
      headers = {},
      onMessage,
      onDone,
      onError,
    } = options;

    const sse = new SSE(url, {
      headers: {
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    sse.addEventListener('message', (event: any) => {
      if (!event?.data) return;

      try {
        const payload = JSON.parse(event.data);

        if (payload.done) {
          sse.close();
          onDone?.();
          return;
        }

        if (payload.data) {
          onMessage(payload.data);
        }
      } catch {
        console.warn('[ChatStream] Invalid payload', event.data);
      }
    });

    sse.addEventListener('error', (err: any) => {
      sse.close();
      onError?.(err);
    });

    return () => sse.close();
  },
};
