import axios from "axios";
import { groqConfig } from "../config/groq";

const client = axios.create({
  baseURL: groqConfig.baseUrl,
  timeout: groqConfig.timeoutMs,
  headers: groqConfig.headers,
});

type GroqMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export const groqClient = {
  async chat(messages: GroqMessage[]) {
    const { data } = await client.post("/chat/completions", {
      model: groqConfig.model,
      temperature: 0.2,
      messages,
    });

    return {
      content: data?.choices?.[0]?.message?.content ?? "",
      usage: {
        prompt: data?.usage?.prompt_tokens ?? 0,
        completion: data?.usage?.completion_tokens ?? 0,
        total: data?.usage?.total_tokens ?? 0,
      },
    };
  },
};
