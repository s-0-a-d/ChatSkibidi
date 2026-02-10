
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Language } from "../types.ts";

const getSystemInstruction = (lang: Language) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const baseInstruction = lang === 'vi' 
    ? `Bạn là Mồn Lèo AI, một trợ lý ảo siêu thông minh được phát triển bởi 'Thanh'. Hôm nay là: ${dateStr}.`
    : `You are Mồn Lèo AI, a super intelligent AI assistant developed by 'Thanh'. Today is: ${dateStr}.`;

  const instructions = lang === 'vi'
    ? `\nHướng dẫn:
1. Trả lời bằng tiếng Việt một cách tự nhiên.
2. Giữ phong cách chuyên nghiệp nhưng thân thiện.
3. Tên của bạn luôn là "Mồn Lèo AI", không được đổi.`
    : `\nInstructions:
1. Respond naturally in English.
2. Keep a professional yet friendly tone.
3. Your name is always "Mồn Lèo AI", do not translate or change it.`;

  return baseInstruction + instructions;
};

export const createChatSession = (apiKey: string, lang: Language, useSearch: boolean = false) => {
  if (!apiKey) throw new Error("API Key is missing");
  
  const ai = new GoogleGenAI({ apiKey });
  
  // Chỉ thêm công cụ tìm kiếm nếu người dùng bật, để tránh lỗi 429
  const tools = useSearch ? [{ googleSearch: {} }] : undefined;

  return ai.chats.create({
    model: 'gemini-3-flash-preview', 
    config: {
      systemInstruction: getSystemInstruction(lang),
      temperature: 0.7,
      topP: 0.95,
      tools: tools
    },
  });
};

export async function* sendMessageStream(chat: any, message: string) {
  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text || "";
      yield text;
    }
  } catch (error: any) {
    console.error("Gemini API Detailed Error:", error);
    
    const errorBody = error.message || "";
    
    // Kiểm tra lỗi 429 - Hết hạn mức
    if (errorBody.includes("429") || errorBody.includes("RESOURCE_EXHAUSTED") || errorBody.includes("quota")) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    
    if (errorBody.includes("401") || errorBody.includes("403") || errorBody.includes("API key not valid")) {
      throw new Error("API_KEY_INVALID");
    }

    if (errorBody.includes("404")) {
      throw new Error("MODEL_NOT_AVAILABLE");
    }

    throw new Error(errorBody || "Unknown connection error");
  }
}
