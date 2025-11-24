
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Gemini API client
// The API key must be provided via the process.env.API_KEY environment variable.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a creative caption for an art post based on a short draft or keywords.
 */
export const generateCreativeCaption = async (draft: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a social media assistant for a professional artist. 
      Rewrite the following draft into an engaging, artistic, and professional social media caption. 
      Include relevant hashtags for the Indian art community.
      
      Draft: "${draft}"`,
    });
    return response.text || "Could not generate caption.";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "Error generating caption. Please try again.";
  }
};

/**
 * Analyzes an uploaded image to generate a caption and tags.
 */
export const analyzeImageForPost = async (base64Image: string): Promise<{ caption: string, tags: string[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image.split(',')[1]
          }
        },
        {
          text: "Analyze this artwork. Provide a creative, engaging social media caption describing the style, mood, and content. Also provide 5-8 relevant hashtags (space separated, no # symbols)."
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            tags: { type: Type.STRING } 
          }
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    const tags = result.tags ? (result.tags as string).split(' ') : [];
    return { caption: result.caption || '', tags };
  } catch (error) {
    console.error("Error analyzing image:", error);
    return { caption: '', tags: [] };
  }
};

/**
 * Generates a video using Veo model.
 */
export const generateVeoVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '16:9'): Promise<string | null> => {
  try {
    // API Key check for Veo models
    // @ts-ignore
    if (window.aistudio && window.aistudio.hasSelectedApiKey && !(await window.aistudio.hasSelectedApiKey())) {
       // @ts-ignore
       await window.aistudio.openSelectKey();
       // Race condition mitigation: assume success if dialog closes
    }

    // Create a fresh client to pick up the potentially new key
    const veoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });

    console.log("Starting video generation with Veo...");
    let operation = await veoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '1080p',
        aspectRatio: aspectRatio
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      console.log("Polling video status...");
      operation = await veoAi.operations.getVideosOperation({operation: operation});
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) return null;

    // Fetch the actual video bytes
    const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Error generating video:", error);
    if (typeof error === 'object' && error !== null && 'message' in error && (error as any).message.includes("Requested entity was not found")) {
        // Reset key if needed
        // @ts-ignore
        if (window.aistudio && window.aistudio.openSelectKey) await window.aistudio.openSelectKey();
    }
    return null;
  }
};

/**
 * Search for studios using Google Maps Grounding
 */
export const searchStudiosWithMaps = async (location: string): Promise<{ text: string, chunks: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Find top rated art studios, recording studios, or creative spaces in ${location}. Provide their names, a brief description, and rating if available.`,
      config: {
        tools: [{ googleMaps: {} }],
      },
    });
    
    return {
      text: response.text || "No results found.",
      chunks: (response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[]) || []
    };
  } catch (error) {
    console.error("Error searching with Maps:", error);
    return { text: "Error searching maps.", chunks: [] };
  }
};

/**
 * Suggests relevant hashtags based on post content.
 */
export const suggestHashtags = async (content: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Analyze the following text and extract or generate 5-8 relevant, high-traffic hashtags for an art community.
      Return only the tags separated by spaces (e.g. "oilpainting digitalart sketch"). Do not include the hash symbol (#).
      
      Text: "${content}"`,
    });
    
    const raw = response.text || '';
    const tags: string[] = raw.split(/\s+/)
      .map((t: string) => t.replace(/[^a-zA-Z0-9_]/g, ''))
      .filter((t: string) => t.length > 0);
      
    return [...new Set(tags)].slice(0, 8);
  } catch (error) {
    console.error("Error generating hashtags:", error);
    return [];
  }
};

/**
 * Provides an AI critique or appreciation for a post context.
 */
export const getArtCritique = async (postContent: string, artistName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a supportive yet critical senior art curator. 
      Write a short, constructive, and encouraging comment (under 280 chars) for an artwork posted by ${artistName}.
      The artist describes it as: "${postContent}".
      Focus on composition, emotion, or technique.`,
    });
    return response.text || "Nice work!";
  } catch (error) {
    console.error("Error generating critique:", error);
    return "Great piece! (AI unavailable)";
  }
};

/**
 * Search for studios helper (legacy/simulated).
 */
export const getStudioRecommendation = async (location: string): Promise<string> => {
   try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Recommend the vibe and typical equipment found in a high-end art/audio studio in ${location}, India. Keep it brief (1 sentence).`,
    });
    return response.text || "A professional space for creators.";
  } catch (error) {
    return "Top tier equipment and soundproofing.";
  }
}

/**
 * Generates a description for a community feature (Group, Event, Page).
 */
export const generateDescription = async (name: string, type: 'Group' | 'Event' | 'Page'): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, inviting, and professional description (max 2 sentences) for a new Artist ${type} named "${name}".`,
    });
    return response.text || `Welcome to the ${name} ${type}!`;
  } catch (error) {
    return `A great place for ${name}.`;
  }
};

/**
 * Generates an AI profile picture based on user name and bio.
 */
export const generateAIProfilePicture = async (name: string, bio: string): Promise<string | null> => {
  try {
    const prompt = `A professional, artistic profile picture for an artist named ${name}. 
    They describe themselves as: "${bio}". 
    Style: Digital Art, Vibrant, Professional Headshot style but artistic. High quality, centered.`;

    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        aspectRatio: '1:1',
        outputMimeType: 'image/jpeg',
      }
    });

    const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64Image) {
      return `data:image/jpeg;base64,${base64Image}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating AI profile picture:", error);
    return null;
  }
};

/**
 * Moderates content to check for hate speech, harassment, or unsafe text.
 * Returns TRUE if content is safe, FALSE if unsafe.
 */
export const moderateContent = async (text: string): Promise<boolean> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Classify the following text for a social media live stream chat. 
      If it contains hate speech, severe profanity, harassment, or sexually explicit content, answer "UNSAFE".
      Otherwise, answer "SAFE".
      
      Text: "${text}"`,
    });
    
    const result = response.text?.trim().toUpperCase();
    return result === "SAFE";
  } catch (error) {
    console.error("Moderation error:", error);
    return true; // Fail open if AI is down to avoid blocking legitimate users, or false to be strict.
  }
};
