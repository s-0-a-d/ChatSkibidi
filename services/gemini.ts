
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Role, Language, Message, Attachment, AppMode } from "../types.ts";

const ODH_DOCUMENTATION = `
Framework: odh_shared_plugins (Roblox Plugin System)
API Reference:
1. Initialize: local shared = odh_shared_plugins
2. Create Section: local my_own_section = shared.AddSection(name: string)
3. Labels: section:AddLabel(text: string)
4. Paragraphs: section:AddParagraph(title: string, desc: string)
5. Toggles: section:AddToggle(name: string, callback: function(bool))
6. Sliders: section:AddSlider(name: string, min: int, max: int, default: int, callback: function(int))
7. Dropdowns: local d = section:AddDropdown(name: string, list: table, callback: function(selected))
   - d.Select(val), d.Change(new_list)
8. PlayerDropdown: section:AddPlayerDropdown(name: string, callback: function(player))
9. Textbox: section:AddTextBox(name: string, callback: function(text))
10. Buttons: section:AddButton(name: string, callback: function())
11. Keybinds: section:AddKeybind(name: string, defaultKey: string, callback: function())
12. Notifications: shared.Notify(msg, type) -> 1:SUCCESS, 2:ERROR, 3:WARN, 4:INFO
13. Identifiers: shared.is_premium_user, shared.discord_name, shared.game_name (e.g. "Murder Mystery 2")
`;

const getSystemInstruction = (lang: Language, mode: AppMode) => {
  const now = new Date();
  const dateStr = now.toLocaleDateString(lang, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  let basePrompt = "";
  if (mode === 'odh_plugin') {
    basePrompt = `You are ODH Plugin Maker AI. Your absolute priority is generating Lua scripts for Roblox executors using the odh_shared_plugins framework.
    DOCUMENTATION:
    ${ODH_DOCUMENTATION}
    
    Rules for ODH Mode:
    1. Always provide complete, ready-to-use Lua code blocks.
    2. Use the exact API methods from the documentation.
    3. If the user asks for a feature like "Aimbot" or "ESP", implement the UI components using this framework.
    4. Respond in ${lang === 'vi' ? 'Vietnamese' : 'English'} but keep code comments relevant.`;
  } else {
    basePrompt = `You are Mồn Lèo AI, a super intelligent AI assistant developed by 'Thanh'. Today is: ${dateStr}.
    Respond naturally in ${lang}. Your name is always 'Mồn Lèo AI'. You can see images and read PDF documents.`;
  }

  return basePrompt;
};

export async function* sendMessageStream(
  apiKey: string, 
  lang: Language, 
  history: Message[], 
  currentText: string, 
  attachment?: Attachment,
  useSearch: boolean = false,
  mode: AppMode = 'standard'
) {
  try {
    const ai = new GoogleGenAI({ apiKey });
    const tools = useSearch && mode === 'standard' ? [{ googleSearch: {} }] : undefined;

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
      model: mode === 'odh_plugin' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: getSystemInstruction(lang, mode),
        temperature: mode === 'odh_plugin' ? 0.4 : 0.7, // Lower temperature for better code generation
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
    throw new Error(errorBody || "Unknown error");
  }
}
