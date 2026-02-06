
import { GoogleGenAI } from "@google/genai";

export const analyzeFileMetadata = async (
  fileName: string, 
  fileSize: string, 
  fileType: string, 
  hash: string
): Promise<string> => {
  try {
    // Initialize inside the function to ensure the latest API key is used
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze this file data:
        - Name: ${fileName}
        - Size: ${fileSize}
        - Type: ${fileType}
        - SHA3-256: ${hash}

        Provide a brief, professional summary (2-3 sentences) explaining:
        1. What this file type typically is used for.
        2. Why a SHA3-256 fingerprint is important for this specific file.
        3. A safety reminder about checking hashes for unknown sources.
        Keep it concise and technical.
      `,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "AI Analysis unavailable.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return "Could not perform AI analysis at this time.";
  }
};
