// services/ChatStreamService.ts
import { ChatStreamOptions } from '@/core/api/models/ClientModel';
import SSE from 'react-native-sse';

export const ChatStreamService = {
  start(options: ChatStreamOptions) {
    const {
      url,
      token,
      body,
      method = 'POST',
      headers = {},
      onMessage,
      onDone,
      onError,
    } = options;

    // Debug logging
    console.log('[ChatStream] Starting SSE connection');
    console.log('[ChatStream] URL:', url);
    console.log('[ChatStream] Method:', method);
    console.log('[ChatStream] Body:', body);
    console.log('[ChatStream] Token:', token ? 'present' : 'missing');

    const sseConfig = {
      method: method,
      headers: {
        Accept: 'text/event-stream',
        'Content-Type': 'application/json',
        ...(token ? { uid: token } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    };

    console.log('[ChatStream] SSE Config:', JSON.stringify(sseConfig, null, 2));

    const sse = new SSE(url, sseConfig);

    sse.addEventListener('open', () => {
      console.log('[ChatStream] Connection opened');
    });

    sse.addEventListener('message', (event: any) => {
      console.log('[ChatStream] Raw event:', event);

      if (!event?.data) {
        console.log('[ChatStream] No data in event');
        return;
      }

      console.log('[ChatStream] Raw data:', event.data);

      try {
        const payload = JSON.parse(event.data);
        console.log('[ChatStream] Parsed payload:', payload);

        if (payload.done) {
          console.log('[ChatStream] Stream done');
          sse.close();
          onDone?.();
          return;
        }

        // Server returns 'content' field, not 'data'
        if (payload.content !== undefined) {
          console.log('[ChatStream] Content:', payload.content);
          onMessage(payload.content);
        } else if (payload.data !== undefined) {
          console.log('[ChatStream] Data:', payload.data);
          onMessage(payload.data);
        } else {
          console.log('[ChatStream] No content or data field in payload');
        }
      } catch (e) {
        console.warn('[ChatStream] Invalid payload', event.data, e);
      }
    });

    sse.addEventListener('error', (err: any) => {
      console.error('[ChatStream] Error:', JSON.stringify(err));
      sse.close();
      onError?.(err);
    });

    return () => {
      console.log('[ChatStream] Closing connection');
      sse.close();
    };
  },
};
