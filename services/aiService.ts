import { GoogleGenAI } from "@google/genai";

// Initialize inside the function to ensure safe execution even if env vars are tricky at load time
export const generateImage = async (prompt: string): Promise<string | null> => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey) {
      console.warn("API Key is missing. Cannot generate image.");
      throw new Error("API Key not configured");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Using gemini-2.5-flash-image for standard image generation tasks
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: prompt,
          },
        ],
      },
      // Note: responseMimeType and responseSchema are not supported for image models
      config: {} 
    });

    if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content.parts;
        // Iterate through parts to find the inline image data
        for (const part of parts) {
            if (part.inlineData) {
                const base64EncodeString = part.inlineData.data;
                return `data:image/png;base64,${base64EncodeString}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("AI Generation Error:", error);
    throw error;
  }
};