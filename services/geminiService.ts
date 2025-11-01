
import type { AnalysisResult, GeolocationCoordinates } from '../types';

async function handleApiResponse(response: Response) {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
        throw new Error(errorData.message || 'Failed to communicate with the server.');
    }
    return response.json();
}

export const analyzeMedia = async (
    base64Data: string,
    mimeType: string,
    coordinates: GeolocationCoordinates | null
): Promise<AnalysisResult> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'analyze',
            payload: { base64Data, mimeType, coordinates }
        })
    });
    return handleApiResponse(response);
};

export const generateAudio = async (text: string): Promise<string> => {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            action: 'audio',
            payload: { text }
        })
    });
    const data = await handleApiResponse(response);
    if (!data.audio) {
        throw new Error("No audio data received from server.");
    }
    return data.audio;
};
