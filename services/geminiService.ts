import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("API_KEY is not set. Mocking response or failing gracefully recommended.");
    // In a real app we might throw, but here we'll let the component handle the error or return a default.
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

export const generateCreativeText = async (topic?: string): Promise<string> => {
  const ai = getClient();
  
  try {
    const prompt = topic 
      ? `Write a very short, poetic, nostalgic message about "${topic}". Max 20 words. Style: Vintage typewriter note or pager message.` 
      : "Write a short, cryptic but beautiful sentence about time, memory, or the future. Max 15 words. Style: Vintage typewriter note.";

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "System Error: Ink depleted.";
  } catch (error) {
    console.error("Gemini generation failed:", error);
    return "Connection lost... signal weak.";
  }
};