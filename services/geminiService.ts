import { GoogleGenAI } from "@google/genai";
import { GeoLocation } from "../types";

// Initialize Gemini Client
// IMPORTANT: process.env.API_KEY is automatically injected.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAddressFromCoordinates = async (coords: GeoLocation): Promise<string> => {
  try {
    const model = 'gemini-2.5-flash';
    
    // Using Google Maps tool for grounding as per best practices for geography
    const response = await ai.models.generateContent({
      model: model,
      contents: `What is the precise street address located at Latitude: ${coords.lat}, Longitude: ${coords.lng}? Please return only the address string.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
            retrievalConfig: {
                latLng: {
                    latitude: coords.lat,
                    longitude: coords.lng
                }
            }
        },
        temperature: 0.1, // Low temperature for factual accuracy
      },
    });

    const text = response.text;
    
    if (!text) {
        throw new Error("No address returned from AI");
    }

    // Clean up response if it's chatty
    return text.trim();

  } catch (error) {
    console.error("Gemini Address Lookup Error:", error);
    throw new Error("Could not determine address from coordinates.");
  }
};
