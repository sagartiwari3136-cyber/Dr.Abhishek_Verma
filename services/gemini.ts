
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";

// Initialize the Gemini API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const CHAT_MODEL_NAME = 'gemini-2.5-flash';
const IMAGE_MODEL_NAME = 'gemini-3-pro-image-preview';

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: CHAT_MODEL_NAME,
    config: {
      systemInstruction: "You are the official AI digital assistant for Aditya Kumar, a prominent and progressive politician in India. You speak with humility, patriotism, and clarity. You help citizens understand Aditya's vision for development, education, and technology. You are polite, respectful, and avoid controversy by focusing on constructive policy and future vision. Keep answers concise and suitable for a mobile chat interface. Use 'Namaste' or 'Jai Hind' occasionally where appropriate.",
      tools: [{ googleSearch: {} }],
    },
  });
};

export const sendMessageToGemini = async (
  chat: Chat,
  text: string,
  imageBase64?: string
): Promise<AsyncIterable<GenerateContentResponse>> => {
  
  try {
    if (imageBase64) {
       const parts: Part[] = [];
       
       parts.push({
         inlineData: {
           mimeType: 'image/jpeg',
           data: imageBase64
         }
       });

       if (text) {
         parts.push({ text });
       }
       
       return await chat.sendMessageStream({ 
           message: parts 
       });
    } else {
        return await chat.sendMessageStream({ message: text });
    }

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const generateImage = async (
    prompt: string, 
    aspectRatio: string = "1:1"
  ): Promise<{ imageUrl: string | null, mimeType: string | null }> => {
    
    try {
      const response = await ai.models.generateContent({
        model: IMAGE_MODEL_NAME,
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: "1K" // Default for preview
          }
        }
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64 = part.inlineData.data;
          const mimeType = part.inlineData.mimeType || 'image/png';
          return {
            imageUrl: `data:${mimeType};base64,${base64}`,
            mimeType: mimeType
          };
        }
      }
      return { imageUrl: null, mimeType: null };
    } catch (error) {
      console.error("Image Gen Error:", error);
      throw error;
    }
};
