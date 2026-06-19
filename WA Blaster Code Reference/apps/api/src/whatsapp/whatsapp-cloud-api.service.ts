import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

export type MetaTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface MetaComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: { body_text?: string[][]; header_text?: string[] };
  buttons?: Array<{
    type: 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface SubmitTemplateInput {
  name: string;
  language: string; // Meta's locale code, e.g. "en", "ms", "zh_CN"
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: MetaComponent[];
}

export interface MetaTemplateResponse {
  id: string;
  status: MetaTemplateStatus;
  category: string;
}

export interface SendTemplateMessageInput {
  toPhoneE164: string;             // recipient, e.g. "+60123456789"
  templateName: string;
  templateLanguage: string;        // Meta locale, e.g. "en", "ms"
  components?: MetaSendComponent[];
}

export interface MetaSendComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{ type: 'text'; text: string }>;
  sub_type?: 'url' | 'quick_reply';
  index?: number;
}

export interface SendMessageResponse {
  metaMessageId: string;
}

const BASE_URL = 'https://graph.facebook.com';

@Injectable()
export class WhatsappCloudApiService {
  private readonly logger = new Logger(WhatsappCloudApiService.name);
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

  async submitTemplate(input: SubmitTemplateInput): Promise<MetaTemplateResponse> {
    if (this.mockMode) {
      return {
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'PENDING',
        category: input.category,
      };
    }

    const wabaId = this.config.getOrThrow<string>('WHATSAPP_WABA_ID');
    try {
      const { data } = await this.http.post(
        `/${this.apiVersion}/${wabaId}/message_templates`,
        input,
        { headers: this.authHeader() },
      );
      return { id: data.id, status: data.status, category: data.category };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  async getTemplateStatus(metaTemplateId: string): Promise<MetaTemplateResponse> {
    if (this.mockMode) {
      return { id: metaTemplateId, status: 'PENDING', category: 'MARKETING' };
    }
    try {
      const { data } = await this.http.get(
        `/${this.apiVersion}/${metaTemplateId}`,
        { headers: this.authHeader() },
      );
      return { id: data.id, status: data.status, category: data.category };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  async sendMessage(input: SendTemplateMessageInput): Promise<SendMessageResponse> {
    if (this.mockMode) {
      return {
        metaMessageId: `wamid.mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      };
    }

    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const body = {
      messaging_product: 'whatsapp',
      to: input.toPhoneE164.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.templateLanguage },
        components: input.components ?? [],
      },
    };
    try {
      const { data } = await this.http.post(
        `/${this.apiVersion}/${phoneNumberId}/messages`,
        body,
        { headers: this.authHeader() },
      );
      const id = data?.messages?.[0]?.id;
      if (!id) throw new Error('Meta response missing message id');
      return { metaMessageId: id };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  async sendFreeFormText(toPhoneE164: string, body: string): Promise<SendMessageResponse> {
    if (this.mockMode) {
      return {
        metaMessageId: `wamid.mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      };
    }

    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const payload = {
      messaging_product: 'whatsapp',
      to: toPhoneE164.replace(/^\+/, ''),
      type: 'text',
      text: { body },
    };
    try {
      const { data } = await this.http.post(
        `/${this.apiVersion}/${phoneNumberId}/messages`,
        payload,
        { headers: this.authHeader() },
      );
      const id = data?.messages?.[0]?.id;
      if (!id) throw new Error('Meta response missing message id');
      return { metaMessageId: id };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  private transformError(err: unknown): Error {
    const axiosErr = err as AxiosError<{ error?: Record<string, unknown> }>;
    const metaError = axiosErr.response?.data?.error;
    if (metaError) {
      // Dump the full Meta error object so we can see message, code, subcode, user_msg, fbtrace_id, etc.
      this.logger.warn(`Meta API error (full): ${JSON.stringify(metaError, null, 2)}`);
      if (axiosErr.config?.data) {
        this.logger.warn(`Request payload: ${typeof axiosErr.config.data === 'string' ? axiosErr.config.data : JSON.stringify(axiosErr.config.data)}`);
      }
      const msg = typeof metaError.message === 'string' ? metaError.message : 'Unknown Meta error';
      return new Error(msg);
    }
    if (axiosErr.message) return new Error(`Meta API call failed: ${axiosErr.message}`);
    return new Error('Meta API call failed');
  }
}
