
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Modality } from "@google/genai";
import type { AnalysisResult, GeolocationCoordinates } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set on Vercel");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const analyzeMediaOnServer = async (
    base64Data: string,
    mimeType: string,
    coordinates: GeolocationCoordinates | null
): Promise<AnalysisResult> => {
    const isVideo = mimeType.startsWith('video/');
    const modelName = isVideo ? 'gemini-2.5-pro' : 'gemini-2.5-flash';

    const prompt = `
Analyze this ${isVideo ? 'video' : 'image'} to identify the geographical location.
- Identify the specific landmark, city, and country.
- Using your tools, provide a summary of what this place is famous for, including user reviews if available.
- Your final response must be ONLY a JSON object with keys "en" and "ru".
- The "en" value should be a detailed description of the location in English. Include the landmark name, city, and country. Provide information about reviews and what the place is known for.
- The "ru" value should be a detailed description of the location in Russian. Include the landmark name, city, and country. Provide information about reviews and what the place is known for.
- Do not include any other text, markdown formatting, or bracketed citations like [1] or [2] outside of the JSON object.
    `.trim();

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType } },
                    { text: prompt }
                ]
            },
            config: {
                tools: [{ googleSearch: {} }, { googleMaps: {} }],
                ...(coordinates && {
                    toolConfig: {
                        retrievalConfig: {
                            latLng: {
                                latitude: coordinates.latitude,
                                longitude: coordinates.longitude
                            }
                        }
                    }
                })
            }
        });

        let text = response.text.trim();
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            text = jsonMatch[2];
        }
        
        const parsedResult = JSON.parse(text);
        const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        const cleanEn = (parsedResult.en || "").replace(/\[\d+\]/g, "").trim();
        const cleanRu = (parsedResult.ru || "").replace(/\[\d+\]/g, "").trim();

        return {
            en: cleanEn,
            ru: cleanRu,
            sources: sources
        };
    } catch (error) {
        console.error("Error analyzing media on server:", error);
        throw new Error("Failed to analyze the media. The model could not identify the location.");
    }
};

const generateAudioOnServer = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Say this naturally: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
            throw new Error("No audio data received from API.");
        }
        return base64Audio;
    } catch (error) {
        console.error("Error generating audio on server:", error);
        throw new Error("Failed to generate audio summary.");
    }
};


export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        if (action === 'analyze') {
            const { base64Data, mimeType, coordinates } = payload;
            if (!base64Data || !mimeType) {
                return res.status(400).json({ error: 'Missing base64Data or mimeType for analysis' });
            }
            const result = await analyzeMediaOnServer(base64Data, mimeType, coordinates);
            return res.status(200).json(result);

        } else if (action === 'audio') {
            const { text } = payload;
            if (!text) {
                return res.status(400).json({ error: 'Missing text for audio generation' });
            }
            const audioData = await generateAudioOnServer(text);
            return res.status(200).json({ audio: audioData });

        } else {
            return res.status(400).json({ error: 'Invalid action specified. Use "analyze" or "audio".' });
        }
    } catch (error) {
        console.error(`Error in /api/gemini:`, error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred.';
        return res.status(500).json({ error: 'Internal Server Error', message });
    }
}
