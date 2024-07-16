import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    history: [
      {
        role: {
          type: String,
          enum: ["user", "model", "system", "assistant"],
          required: true,
        },
        parts: [
          {
            text: {
              type: String,
              required: true,
            },
          },
        ],
        img: {
          type: String,
          required: false,
        }
      }
    ],
    model: {
      type: String,
      enum: ["gpt-4.1-mini", "gpt-4o-mini", "gpt-4o", "gpt-4.1", "o4-mini", "gemini-flash-1.5"],
      required: true,
    },
    isCustomChatbot: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Chat || mongoose.model("Chat", chatSchema);