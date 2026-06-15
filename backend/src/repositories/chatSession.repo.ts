import { ChatSessionModel } from "../models/ChatSession";

type CreateSessionInput = {
  sessionId: string;
  userId?: string;
  mode?: "market" | "defi" | "auto";
};

type AppendMessageInput = {
  role: "user" | "assistant" | "system";
  content: string;
};

export const chatSessionRepo = {
  async create(input: CreateSessionInput) {
    return ChatSessionModel.create({
      sessionId: input.sessionId,
      user: input.userId ?? null,
      mode: input.mode ?? "auto",
      messages: [],
    });
  },

  async findBySessionId(sessionId: string) {
    return ChatSessionModel.findOne({ sessionId }).exec();
  },

  async deleteByUser(userId: string) {
    return ChatSessionModel.deleteMany({ user: userId }).exec();
  },

  async appendMessage(sessionId: string, message: AppendMessageInput) {
    return ChatSessionModel.findOneAndUpdate(
      { sessionId },
      {
        $push: {
          messages: {
            role: message.role,
            content: message.content,
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec();
  },
};
