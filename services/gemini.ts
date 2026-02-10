
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Language, Message, Attachment } from "../types.ts";

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
    en: "\nInstructions:\n1. Respond naturally in English.\n2. Keep a professional yet friendly tone.\n3. Your name is always 'Mồn Lèo AI'.\n4. You can see images and read PDF documents if the user provides them.",
    vi: "\nHướng dẫn:\n1. Trả lời bằng tiếng Việt một cách tự nhiên.\n2. Giữ phong cách chuyên nghiệp nhưng thân thiện.\n3. Tên của bạn luôn là 'Mồn Lèo AI'.\n4. Bạn có thể nhìn hình ảnh và đọc tài liệu PDF nếu người dùng cung cấp.",
    fr: "\nInstructions :\n1. Répondez naturellement en français.\n2. Gardez un ton professionnel mais amical.\n3. Votre nom est 'Mồn Lèo AI'.\n4. Bạn có thể xem hình ảnh và tài liệu PDF.",
    ja: "\n指示：\n1. 自然な日本語で答えてください。\n2. あなたの名前は 'Mồn Lèo AI' です。\n3. 画像やPDFドキュメントを読み取ることができます。",
    ko: "\n지침:\n1. 자연스러운 한국어로 응답하십시오.\n2. 당신의 이름은 'Mồn Lèo AI'입니다.\n3. 이미지와 PDF 문서를 읽을 수 있습니다.",
    zh: "\n说明：\n1. 用自然的中文回答。\n2. 你的名字永远是 'Mồn Lèo AI'。\n3. 你可以查看图片和阅读 PDF 文档。"
  };

  return greetings[lang] + rules[lang];
};

export async function* sendMessageStream(
  apiKey: string, 
  lang: Language, 
  history: Message[], 
  currentText: string, 
  attachment?: Attachment,
  useSearch: boolean = false
) {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const tools = useSearch ? [{ googleSearch: {} }] : undefined;

    // Chuyển đổi lịch sử chat sang định dạng API
    const contents = history.map(m => ({
      role: m.role,
      parts: m.attachment ? [
        { inlineData: { data: m.attachment.data, mimeType: m.attachment.mimeType } },
        { text: m.text }
      ] : [{ text: m.text }]
    }));

    // Thêm tin nhắn hiện tại
    const currentParts: any[] = [{ text: currentText }];
    if (attachment) {
      currentParts.unshift({
        inlineData: {
          data: attachment.data,
          mimeType: attachment.mimeType
        }
      });
    }

    contents.push({ role: Role.USER, parts: currentParts });

    const result = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(lang),
        temperature: 0.7,
        tools: tools
      }
    });

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield c.text || "";
    }
  } catch (error: any) {
    const errorBody = error.message || "";
    if (errorBody.includes("429") || errorBody.includes("RESOURCE_EXHAUSTED")) throw new Error("QUOTA_EXHAUSTED");
    if (errorBody.includes("401") || errorBody.includes("403")) throw new Error("API_KEY_INVALID");
    throw new Error(errorBody || "Unknown error");
  }
}
