
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role } from "../types.ts";

const getSystemInstruction = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('vi-VN');
  
  return `Bạn là Thanh AI, một trợ lý ảo siêu thông minh được phát triển bởi 'Thanh'. 
HÔM NAY LÀ: ${dateStr}, BÂY GIỜ LÀ: ${timeStr}. 
Mục tiêu: Cung cấp thông tin chính xác, cập nhật nhất bằng tiếng Việt.
Hướng dẫn:
1. Luôn ưu tiên dùng công cụ Google Search để kiểm tra tin tức mới nhất trước khi trả lời.
2. Trả lời lịch sự, thông minh, sâu sắc.
3. Nếu người dùng hỏi về thời gian, hãy dựa vào dữ liệu hệ thống đã cung cấp ở trên.
4. Sử dụng định dạng Markdown đẹp mắt.`;
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được thiết lập.");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = () => {
  const ai = getAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: getSystemInstruction(),
      temperature: 0.8,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 16000 }, // Kích hoạt khả năng "suy nghĩ" sâu hơn
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
    throw error;
  }
}
