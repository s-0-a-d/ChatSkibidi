
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Language, Message, Attachment, AppMode } from "../types.ts";

const ODH_DOCS = `
ODH (Open Discord Hub) Framework Documentation:
- Root: shared.ODH
- UI: shared.ODH.UI (Library for creating Roblox UI)
- Classes: UI.new("Frame", properties), UI.new("TextLabel", properties)
- Features: Draggable, Resizable, Themeable.
- Example: 
  local Window = shared.ODH.UI.new("Window", {Title = "My Plugin", Size = UDim2.new(0, 300, 0, 200)})
  shared.ODH.Plugins:Register(Window)
`;

const getSystemInstruction = (lang: Language, mode: AppMode) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  let base = `You are Mồn Lèo AI, a super intelligent and friendly AI assistant developed by 'Thanh'. 
  Today is: ${dateStr}. Respond naturally in ${lang === 'vi' ? 'Vietnamese' : 'English'}. 
  Your name is 'Mồn Lèo AI'.`;

  if (mode === 'odh_plugin') {
    base += `\n\nSPECIAL MODE: ODH PLUGIN MAKER.
    You specialize in writing Roblox Lua scripts using the ODH Framework.
    ${ODH_DOCS}
    Always provide code that is compatible with ODH structure. Provide complete, working scripts.`;
  }

  return base;
};

export async function* sendMessageStream(
  apiKey: string,
  lang: Language, 
  history: Message[], 
  currentText: string, 
  attachment?: Attachment,
  mode: AppMode = 'standard'
) {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || process.env.API_KEY || '' });
    const modelName = 'gemini-3-flash-preview';

    const contents = history.map(m => ({
      role: m.role,
      parts: m.attachment ? [
        { inlineData: { data: m.attachment.data, mimeType: m.attachment.mimeType } },
        { text: m.text }
      ] : [{ text: m.text }]
    }));

    const currentParts: any[] = [{ text: currentText }];
    if (attachment) {
      currentParts.unshift({ inlineData: { data: attachment.data, mimeType: attachment.mimeType } });
    }

    contents.push({ role: Role.USER, parts: currentParts });

    const result = await ai.models.generateContentStream({
      model: modelName,
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(lang, mode),
        temperature: 0.7
      }
    });

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      yield c.text || "";
    }
  } catch (error: any) {
    const errorBody = error.message || "";
    if (errorBody.includes("429") || errorBody.includes("RESOURCE_EXHAUSTED")) {
      throw new Error("QUOTA_EXHAUSTED");
    }
    throw new Error(errorBody || "Unknown error");
  }
}
