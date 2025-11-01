
export type Language = 'en' | 'ru';

export interface GroundingChunk {
  web?: {
    // FIX: Made uri and title optional to match the type from @google/genai SDK.
    uri?: string;
    title?: string;
  };
  maps?: {
    // FIX: Made uri and title optional to match the type from @google/genai SDK.
    uri?: string;
    title?: string;
  };
}

export interface AnalysisResult {
  en: string;
  ru: string;
  sources: GroundingChunk[];
}

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}