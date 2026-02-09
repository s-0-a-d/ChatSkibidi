
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role } from "../types.ts";

const getSystemInstruction = () => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('vi-VN');
  
  return `Tên của bạn là Thanh AI. Bạn là một trợ lý ảo thông minh được phát triển bởi 'Thanh'. 
HÔM NAY LÀ: ${dateStr}, bây giờ là ${timeStr}. 
Bạn phải luôn sử dụng công cụ Google Search để cập nhật thông tin thực tế mới nhất trước khi trả lời. 
Không bao giờ khẳng định năm 2026 là tương lai nếu hôm nay đã là năm 2026 (hoặc ngược lại). 
Hãy trả lời lịch sự, thân thiện bằng tiếng Việt.`;
};

// Hàm lấy client AI mới nhất để đảm bảo luôn dùng Key vừa được chọn
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key chưa được thiết lập. Vui lòng chọn API Key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = () => {
  const ai = getAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview', // Nâng cấp lên Pro để hỗ trợ logic phức tạp hơn
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
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    if (error.message?.includes("entity was not found")) {
      throw new Error("API_KEY_INVALID");
    }
    throw error;
  }
}
