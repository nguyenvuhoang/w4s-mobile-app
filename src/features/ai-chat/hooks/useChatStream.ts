// features/chat/hooks/useChatStream.ts
import { ChatStreamOptions } from '@/core/api/models/ClientModel';
import { chatRepository } from '@/services/repositories/chat.repository';

export function useChatStream() {
  let cleanup: (() => void) | null = null;

  const start = (options: ChatStreamOptions) => {
    cleanup?.();
    cleanup = chatRepository.streamChat(options);
  };

  const stop = () => {
    cleanup?.();
    cleanup = null;
  };

  return { start, stop };
}
