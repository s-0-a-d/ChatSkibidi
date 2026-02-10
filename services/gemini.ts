
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Language } from "../types.ts";

const getSystemInstruction = (lang: Language) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const greetings: Record<Language, string> = {
    en: `You are Mồn Lèo AI, a super intelligent AI assistant developed by 'Thanh'. Today is: ${dateStr}.`,
    vi: `Bạn là Mồn Lèo AI, một trợ lý ảo siêu thông minh được phát triển bởi 'Thanh'. Hôm nay là: ${dateStr}.`,
    fr: `Vous êtes Mồn Lèo AI, un assistant IA super intelligent développé par 'Thanh'. Aujourd'hui nous sommes le : ${dateStr}.`,
    ja: `あなたは 'Thanh' によって開発された超知的な AI アシスタント、Mồn Lèo AI です。今日は ${dateStr} です。`,
    ko: `당신은 'Thanh'이 개발한 초지능 AI 어시스턴트 Mồn Lèo AI입니다. 오늘은 ${dateStr}입니다.`,
    zh: `你是 Mồn Lèo AI，由 'Thanh' 开发的超级智能 AI 助手。今天是：${dateStr}。`
  };

  const rules: Record<Language, string> = {
    en: "\nInstructions:\n1. Respond naturally in English.\n2. Keep a professional yet friendly tone.\n3. Your name is always 'Mồn Lèo AI', do not change it.",
    vi: "\nHướng dẫn:\n1. Trả lời bằng tiếng Việt một cách tự nhiên.\n2. Giữ phong cách chuyên nghiệp nhưng thân thiện.\n3. Tên của bạn luôn là 'Mồn Lèo AI', không được đổi.",
    fr: "\nInstructions :\n1. Répondez naturellement en français.\n2. Gardez un ton professionnel mais amical.\n3. Votre nom est toujours 'Mồn Lèo AI', ne le changez pas.",
    ja: "\n指示：\n1. 自然な日本語で答えてください。\n2. プロフェッショナルでありながらフレンドリーなトーンを保ってください。\n3. あなたの名前は常に 'Mồn Lèo AI' です。変更しないでください。",
    ko: "\n지침:\n1. 자연스러운 한국어로 응답하십시오.\n2. 전문적이면서도 친근한 어조를 유지하십시오.\n3. 당신의 이름은 항상 'Mồn Lèo AI'입니다. 변경하지 마십시오.",
    zh: "\n说明：\n1. 用自然的中文回答。\n2. 保持专业且友好的语气。\n3. 你的名字永远是 'Mồn Lèo AI'，请勿更改。"
  };

  return greetings[lang] + rules[lang];
};

export const createChatSession = (apiKey: string, lang: Language, useSearch: boolean = false) => {
  if (!apiKey) throw new Error("API Key is missing");
  
  const ai = new GoogleGenAI({ apiKey });
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
    const errorBody = error.message || "";
    if (errorBody.includes("429") || errorBody.includes("RESOURCE_EXHAUSTED")) throw new Error("QUOTA_EXHAUSTED");
    if (errorBody.includes("401") || errorBody.includes("403")) throw new Error("API_KEY_INVALID");
    throw new Error(errorBody || "Unknown error");
  }
}
