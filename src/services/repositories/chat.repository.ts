// services/repositories/chat.repository.ts
import { ChatStreamOptions } from '@/core/api/models/ClientModel';
import { ChatStreamService } from '@/services/ChatStreamService';

export const chatRepository = {
  streamChat(options: ChatStreamOptions) {
    return ChatStreamService.start(options);
  },
};
