/**
 * Gemini model stub — routes through the backend gateway with streaming.
 *
 * The backend emits standard SSE. This wrapper converts to the Gemini
 * stream interface that NewPrompt expects:
 *   for await (const chunk of result.stream) { chunk.text() }
 */

const API_URL = import.meta.env.VITE_API_URL || "";

const model = {
  startChat({ history, generationConfig }) {
    return {
      async sendMessageStream(parts) {
        const messages = [];
        for (const entry of history || []) {
          messages.push({
            role: entry.role === "model" ? "assistant" : entry.role,
            content: entry.parts.map((p) => p.text).join(""),
          });
        }

        const userText = Array.isArray(parts)
          ? parts.filter((p) => typeof p === "string").join(" ")
          : String(parts);
        messages.push({ role: "user", content: userText });

        const res = await fetch(`${API_URL}/api/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ model: "gpt-4.1-mini", messages }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `Gateway error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const stream = {
          [Symbol.asyncIterator]() {
            return {
              async next() {
                while (true) {
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
                          const parsed = JSON.parse(payload);
                          const content = parsed.choices?.[0]?.delta?.content || "";
                          if (content) {
                            return { done: false, value: { text: () => content } };
                          }
                        } catch {}
                      }
                    }
                    continue;
                  }

                  const { done, value } = await reader.read();
                  if (done) {
                    if (buffer.trim()) {
                      for (const line of buffer.split("\n")) {
                        if (line.startsWith("data: ") && line.slice(6) !== "[DONE]") {
                          try {
                            const parsed = JSON.parse(line.slice(6));
                            const content = parsed.choices?.[0]?.delta?.content || "";
                            buffer = "";
                            if (content) return { done: false, value: { text: () => content } };
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

        return { stream };
      },
    };
  },
};

export default model;
