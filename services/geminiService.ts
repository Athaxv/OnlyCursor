import { GoogleGenAI } from "@google/genai";

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper to convert image URL to Base64 for Gemini
export const urlToBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error converting image to base64:", error);
    throw new Error("Failed to process image");
  }
};

// Helper to convert Audio Blob to Base64
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const clarifyText = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) return "AI Key Missing";
  if (text.length < 5) return ""; // Ignore tiny text

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Role: Professional Editor. Task: Rewrite the following text to be more concise, punchy, and professional. Output ONLY the rewritten text, no explanations. Max 20 words.
      
      Text: "${text}"`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};

export const navigatorAssist = async (elementContext: string, pageContext: string): Promise<string> => {
  if (!process.env.API_KEY) return "I can help if you add an API Key.";

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Role: UI/UX Expert & Ship Navigator. 
      Task: Explain the function of the UI element the user just clicked. be helpful and brief (max 1 sentence).
      
      Element Context: "${elementContext}"
      Page Context: "${pageContext}"`,
    });
    return response.text || "I'm unable to analyze this element.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Navigation systems offline.";
  }
};

export const navigatorVoiceAssist = async (audioBase64: string, elementContext: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key Required";

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025', // Updated for audio tasks
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/webm', data: audioBase64 } },
          { text: `The user is interacting with a website. They are hovering over an element containing the text/content: "${elementContext}". 
          
          They are asking a question via voice. Answer their question briefly and helpfully, acting as a ship's navigator interface.` }
        ]
      }
    });
    return response.text || "I didn't catch that, Captain.";
  } catch (error) {
    console.error("Gemini Audio Error:", error);
    return "Voice systems offline.";
  }
};

export const analyzeImageRegion = async (imageBase64: string): Promise<string> => {
  if (!process.env.API_KEY) return "API Key Required";

  try {
    const ai = getAI();
    // Remove data:image/png;base64, prefix if present for the API call
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Correct multimodal model
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: "OCR Task: Extract the most important text, numbers, or data points from this image. If it's a chart, summarize the trend. Output raw text only. Keep it brief." }
        ]
      }
    });
    return response.text || "No readable content found.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return "Could not analyze image.";
  }
};