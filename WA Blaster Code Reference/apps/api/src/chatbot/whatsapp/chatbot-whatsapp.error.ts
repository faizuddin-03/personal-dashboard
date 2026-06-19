/**
 * Thrown when the chatbot's Meta Cloud API client fails to send a message.
 * Kept separate from the blasting feature's errors so the chatbot's WhatsApp
 * client is fully self-contained.
 */
export class ChatbotWhatsappError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options as ErrorOptions);
    this.name = 'ChatbotWhatsappError';
  }
}
