/**
 * LLM Client — routes through the backend gateway proxy with SSE streaming.
 *
 * The backend converts the provider's NDJSON stream into standard SSE format:
 *   data: {"choices":[{"delta":{"content":"token"}}]}
 *   data: [DONE]
 *
 * This matches what NewPrompt expects from the OpenAI SDK stream interface.
 */

const API_URL = import.meta.env.VITE_API_URL || "";

class GatewayClient {
  constructor() {
    this.chat = {
      completions: {
        create: this._createCompletion.bind(this),
      },
    };
  }

  async _createCompletion({ model, messages, stream }) {
    const res = await fetch(`${API_URL}/api/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ model, messages }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `Gateway error: ${res.status}`);
    }

    if (stream) {
      return this._parseSSE(res.body);
    }

    return res.json();
  }

  _parseSSE(body) {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return {
      [Symbol.asyncIterator]() {
        return {
          async next() {
            while (true) {
              // Look for complete SSE events in buffer
              const eventEnd = buffer.indexOf("\n\n");
              if (eventEnd !== -1) {
                const event = buffer.slice(0, eventEnd);
                buffer = buffer.slice(eventEnd + 2);

                for (const line of event.split("\n")) {
                  if (line.startsWith("data: ")) {
                    const payload = line.slice(6);
                    if (payload === "[DONE]") {
                      return { done: true, value: undefined };
                    }
                    try {
                      return { done: false, value: JSON.parse(payload) };
                    } catch {}
                  }
                }
                continue;
              }

              // Read more from the stream
              const { done, value } = await reader.read();
              if (done) {
                // Flush remaining buffer
                if (buffer.trim()) {
                  for (const line of buffer.split("\n")) {
                    if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
                      try {
                        buffer = "";
                        return { done: false, value: JSON.parse(line.slice(6)) };
                      } catch {}
                    }
                  }
                }
                return { done: true, value: undefined };
              }
              buffer += decoder.decode(value, { stream: true });
            }
          },
        };
      },
    };
  }
}

const model = new GatewayClient();
export default model;
