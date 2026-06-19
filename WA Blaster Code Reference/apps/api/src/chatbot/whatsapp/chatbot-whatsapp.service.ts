import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { ChatbotWhatsappError } from './chatbot-whatsapp.error';

export interface ChatbotSendResult {
  metaMessageId: string;
}

const BASE_URL = 'https://graph.facebook.com';

/**
 * The chatbot's own Meta Cloud API client. Deliberately independent of the
 * blasting feature's WhatsappCloudApiService — its own axios instance, its own
 * env reads, and its own error type — so the two features never share state.
 */
@Injectable()
export class ChatbotWhatsappService {
  private readonly logger = new Logger(ChatbotWhatsappService.name);
  private readonly mockMode: boolean;
  private readonly apiVersion: string;
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.mockMode = this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true';
    this.apiVersion = this.config.get<string>('WHATSAPP_API_VERSION', 'v20.0');
    this.http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
  }

  private authHeader() {
    return { Authorization: `Bearer ${this.config.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN')}` };
  }

  /**
   * Send a free-form text reply. Throws ChatbotWhatsappError on failure so the
   * caller can decide how to handle a send that didn't land.
   *
   * When `replyToWamid` is supplied, the message is sent as a native WhatsApp reply
   * (quote) to that inbound message, so the customer sees which question it answers —
   * important when a reply is even slightly delayed.
   */
  async sendTextMessage(toPhoneE164: string, body: string, replyToWamid?: string): Promise<ChatbotSendResult> {
    if (!body?.trim()) {
      throw new ChatbotWhatsappError('Cannot send an empty message body');
    }

    if (this.mockMode) {
      return {
        metaMessageId: `wamid.mock-chatbot-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      };
    }

    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const payload = {
      messaging_product: 'whatsapp',
      to: toPhoneE164.replace(/^\+/, ''),
      ...(replyToWamid ? { context: { message_id: replyToWamid } } : {}),
      type: 'text',
      text: { body, preview_url: false },
    };
    try {
      const { data } = await this.http.post(
        `/${this.apiVersion}/${phoneNumberId}/messages`,
        payload,
        { headers: this.authHeader() },
      );
      const id = data?.messages?.[0]?.id;
      if (!id) throw new ChatbotWhatsappError('Meta response missing message id');
      return { metaMessageId: id };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  /**
   * Mark an inbound message as read. Best-effort: read receipts are not worth
   * failing a turn over, so Meta errors are logged and swallowed.
   */
  async markAsRead(metaMessageId: string): Promise<void> {
    if (this.mockMode) {
      return;
    }

    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: metaMessageId,
    };
    try {
      await this.http.post(
        `/${this.apiVersion}/${phoneNumberId}/messages`,
        payload,
        { headers: this.authHeader() },
      );
    } catch (err) {
      const e = this.transformError(err);
      this.logger.warn(`Failed to mark message ${metaMessageId} as read: ${e.message}`);
    }
  }

  private transformError(err: unknown): ChatbotWhatsappError {
    if (err instanceof ChatbotWhatsappError) return err;
    const axiosErr = err as AxiosError<{ error?: Record<string, unknown> }>;
    const metaError = axiosErr.response?.data?.error;
    if (metaError) {
      this.logger.warn(`Meta API error (full): ${JSON.stringify(metaError, null, 2)}`);
      const msg = typeof metaError.message === 'string' ? metaError.message : 'Unknown Meta error';
      return new ChatbotWhatsappError(msg, { cause: err });
    }
    if (axiosErr.message) {
      return new ChatbotWhatsappError(`Meta API call failed: ${axiosErr.message}`, { cause: err });
    }
    return new ChatbotWhatsappError('Meta API call failed', { cause: err });
  }
}
