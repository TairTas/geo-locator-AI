
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { analyzeMedia, generateAudio } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { useGeolocation } from './hooks/useGeolocation';
import useIsMobile from './hooks/useIsMobile';
import FileUpload from './components/FileUpload';
import ResultCard from './components/ResultCard';
import Loader from './components/Loader';
import { AnalysisResult, GeolocationCoordinates, Language } from './types';
import { Languages, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [ttsLanguage, setTtsLanguage] = useState<Language>('en');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  
  const { coordinates, error: geoError } = useGeolocation();
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<'upload' | 'result'>('upload');
  const progressIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (geoError) {
      console.warn("Geolocation error:", geoError);
      // Non-blocking error
    }
  }, [geoError]);

  const resetState = () => {
    setFile(null);
    setFilePreview(null);
    setAnalysisResult(null);
    setAudioData(null);
    setError(null);
    setAudioError(null);
    setIsLoading(false);
    setIsGeneratingAudio(false);
    setAnalysisProgress(0);
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }

  const handleStartNewAnalysis = () => {
    resetState();
    if (isMobile) {
      setMobileView('upload');
    }
  };

  const handleFileChange = (selectedFile: File | null) => {
    if (selectedFile) {
      resetState();
      setFile(selectedFile);
      setFilePreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleAnalyzeClick = useCallback(async () => {
    if (!file) {
      setError('Please upload a file first.');
      return;
    }
    
    resetState();
    setIsLoading(true);
    setLoadingMessage('Analyzing media...');
    if(isMobile) setMobileView('result');

    // Simulate analysis progress
    progressIntervalRef.current = window.setInterval(() => {
        setAnalysisProgress(prev => Math.min(prev + 5, 90));
    }, 500);

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const result = await analyzeMedia(base64, mimeType, coordinates as GeolocationCoordinates);
      
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      setAnalysisProgress(100);
      setAnalysisResult(result);
      setIsLoading(false);

      setIsGeneratingAudio(true);
      try {
        const textToSpeak = ttsLanguage === 'en' ? result.en : result.ru;
        const audio = await generateAudio(textToSpeak);
        setAudioData(audio);
      } catch (audioErr) {
        console.error("Audio generation failed:", audioErr);
        setAudioError(audioErr instanceof Error ? audioErr.message : 'Failed to generate audio.');
      } finally {
        setIsGeneratingAudio(false);
      }

    } catch (analysisErr) {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      console.error("Analysis failed:", analysisErr);
      setError(analysisErr instanceof Error ? analysisErr.message : 'An unknown error occurred during analysis.');
      setIsLoading(false);
    }
  }, [file, coordinates, ttsLanguage, isMobile]);

  const uploadSection = (
      <div className="flex flex-col gap-6">
        <FileUpload onFileChange={handleFileChange} filePreview={filePreview} fileType={file?.type} />
        
        <div>
          <label htmlFor="tts-lang" className="flex items-center gap-2 text-md font-medium text-gray-300 mb-2">
            <Languages size={20} className="text-blue-400" />
            Select Audio Language
          </label>
          <select
            id="tts-lang"
            value={ttsLanguage}
            onChange={(e) => setTtsLanguage(e.target.value as Language)}
            disabled={isLoading || isGeneratingAudio}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          >
            <option value="en">English</option>
            <option value="ru">Русский (Russian)</option>
          </select>
        </div>

        <button
          onClick={handleAnalyzeClick}
          disabled={!file || isLoading || isGeneratingAudio}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg transform transition-transform duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          {isLoading ? 'Analyzing...' : isGeneratingAudio ? 'Generating Audio...' : 'Discover Location'}
        </button>
      </div>
  );

  const resultSection = (
       <div className="relative min-h-[450px] md:min-h-[300px] h-full flex flex-col">
        {isMobile && (analysisResult || error) && (
            <button 
                onClick={handleStartNewAnalysis} 
                className="flex items-center gap-2 mb-4 text-blue-400 hover:text-blue-300"
            >
                <ArrowLeft size={18} />
                Start New Analysis
            </button>
        )}
        <div className="flex-grow">
          {isLoading ? (
            <Loader message={loadingMessage} progress={analysisProgress} />
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-red-900/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-center text-red-400">{error}</p>
            </div>
          ) : analysisResult ? (
            <ResultCard
              result={analysisResult}
              audioData={audioData}
              isGeneratingAudio={isGeneratingAudio}
              audioError={audioError}
            />
          ) : (
              <div className="flex items-center justify-center h-full bg-gray-700/30 border-2 border-dashed border-gray-600 rounded-lg p-4">
              <p className="text-center text-gray-400">Your analysis results will appear here.</p>
            </div>
          )}
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Geo-Locator AI
          </h1>
          <p className="mt-2 text-lg text-gray-400">
            Upload a photo or video to discover its location and story.
          </p>
        </header>

        <main className="bg-gray-800/50 rounded-2xl shadow-2xl p-6 backdrop-blur-sm border border-gray-700">
          {isMobile ? (
            mobileView === 'upload' ? uploadSection : resultSection
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {uploadSection}
              {resultSection}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
