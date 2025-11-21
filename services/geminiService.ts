import { GoogleGenAI } from "@google/genai";

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
 * Search for studios helper (simulated mostly, but could use grounding if needed).
 * For this demo, we will use Gemini to generate a "Studio Recommendation" description based on location.
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
