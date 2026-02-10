
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Language } from "../types.ts";

const getSystemInstruction = (lang: Language) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  if (lang === 'vi') {
    return `Bạn là Mồn Lèo AI, một trợ lý ảo siêu thông minh được phát triển bởi 'Thanh'. 
Hôm nay là: ${dateStr}.
Hướng dẫn:
1. Luôn dùng Google Search cho thông tin mới.
2. Trả lời bằng tiếng Việt.
3. Giữ phong cách chuyên nghiệp nhưng thân thiện.
4. Tên của bạn luôn là "Mồn Lèo AI".`;
  } else {
    return `You are Mồn Lèo AI, a super intelligent AI assistant developed by 'Thanh'.
Today is: ${dateStr}.
Instructions:
1. Always use Google Search for the latest information.
2. Respond in English.
3. Keep a professional yet friendly tone.
4. Your name is always "Mồn Lèo AI", do not translate it.`;
  }
};

export const createChatSession = (apiKey: string, lang: Language) => {
  if (!apiKey) throw new Error("API Key is missing");
  
  const ai = new GoogleGenAI({ apiKey });
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: getSystemInstruction(lang),
      temperature: 0.8,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 16000 },
      tools: [{ googleSearch: {} }]
    },
  });
};

export async function* sendMessageStream(chat: any, message: string) {
  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield c.text || "";
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("API key not valid") || error.message?.includes("403")) {
      throw new Error("API_KEY_INVALID");
    }
    throw new Error(error.message || "Failed to send message");
  }
}
