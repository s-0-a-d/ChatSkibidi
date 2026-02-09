
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role } from "../types.ts";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getSystemInstruction = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('vi-VN');
  
  return `Tên của bạn là Thanh AI. Bạn là một trợ lý ảo thông minh được phát triển bởi 'Thanh' dựa trên công nghệ Google Gemini. 
API Key bạn đang dùng là do 'Thanh' cung cấp.
HÔM NAY LÀ: ${dateStr}, bây giờ là ${timeStr}. 
Hãy nhớ rõ thời điểm hiện tại này để trả lời chính xác các câu hỏi về thời gian. 
Sử dụng công cụ Google Search để kiểm tra tin tức nếu cần. Trả lời lịch sự, thân thiện bằng tiếng Việt.`;
};

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: getSystemInstruction(),
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      tools: [{ googleSearch: {} }]
    },
  });
};

export async function* sendMessageStream(chat: any, message: string) {
  try {
    const result = await chat.sendMessageStream({ message });
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield c.text;
    }
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}
