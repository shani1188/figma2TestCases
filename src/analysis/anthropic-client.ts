import { config } from '../config';
import { withRetry } from '../utils/retry';

export type MessageInput = {
  system: string;
  userText: string;
  imageBase64?: string;
  imageMimeType?: 'image/png' | 'image/jpeg' | 'image/webp';
  maxTokens?: number;
  model?: string;
};

type OllamaChatResponse = {
  message: { role: string; content: string };
  done: boolean;
};

export async function sendMessage(input: MessageInput): Promise<string> {
  return withRetry(async () => {
    const userMessage: { role: string; content: string; images?: string[] } = {
      role: 'user',
      content: input.userText,
    };

    if (input.imageBase64) {
      userMessage.images = [input.imageBase64];
    }

    const messages: { role: string; content: string; images?: string[] }[] = [];
    if (input.system) messages.push({ role: 'system', content: input.system });
    messages.push(userMessage);

    const body = {
      model: input.model ?? config.OLLAMA_MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.2,
        num_predict: input.maxTokens ?? 4096,
      },
    };

    const response = await fetch(`${config.OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error ${response.status}: ${err}`);
    }

    const data = await response.json() as OllamaChatResponse;
    return data.message.content;
  }, 3, 2000);
}
