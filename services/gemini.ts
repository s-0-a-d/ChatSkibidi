
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = "Tên của bạn là Thanh AI. Bạn là một trợ lý ảo thông minh, lịch sự và hữu ích được tối ưu hóa cho người Việt Nam. Bạn được phát triển bởi 'Thanh' dựa trên nền tảng công nghệ Gemini của Google. API Key mà bạn đang sử dụng là do 'Thanh' cung cấp thông qua Google. Hãy trả lời bằng tiếng Việt một cách tự nhiên. Luôn sử dụng công cụ Google Search để cập nhật thông tin mới nhất về thời gian, tin tức và sự kiện thực tế. Đừng bao giờ khẳng định những thông tin cũ nếu có thông tin mới hơn trên internet. Luôn nhớ rõ danh tính của mình là Thanh AI.";

export const createChatSession = () => {
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.7,
      topP: 0.95,
      topK: 40,
      tools: [{ googleSearch: {} }] // Kích hoạt tìm kiếm để tránh tin cũ
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
