import React, { useState, useEffect, useRef } from 'react';
import type { AnalysisResult, Language } from '../types';
import { Volume2, Link as LinkIcon } from 'lucide-react';
import ProgressBar from './ProgressBar';

interface ResultCardProps {
  result: AnalysisResult;
  audioData: string | null;
  isGeneratingAudio: boolean;
  audioError: string | null;
}

// Audio decoding utility functions (as per Gemini docs)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / 1; // Mono channel
  const buffer = ctx.createBuffer(1, frameCount, 24000); // 24kHz sample rate
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  return buffer;
}


const ResultCard: React.FC<ResultCardProps> = ({ result, audioData, isGeneratingAudio, audioError }) => {
  const [selectedLang, setSelectedLang] = useState<Language>('en');
  const audioContextRef = useRef<AudioContext | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState(0);

  // Gets or creates a singleton AudioContext
  const getAudioContext = () => {
    if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
            audioContextRef.current = new AudioContext();
        }
    }
    return audioContextRef.current;
  }

  useEffect(() => {
    const processAudio = async () => {
      const audioContext = getAudioContext();
      if (audioData && audioContext) {
        try {
          const decodedBytes = decode(audioData);
          const buffer = await decodeAudioData(decodedBytes, audioContext);
          setAudioBuffer(buffer);
        } catch (error) {
          console.error("Failed to decode audio data:", error);
        }
      }
    };
    processAudio();
  }, [audioData]);

  useEffect(() => {
    let timer: number | undefined;
    if (isGeneratingAudio) {
      setProgress(0); // Reset on start
      timer = window.setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) { // Pause at 95% to wait for completion
            clearInterval(timer);
            return 95;
          }
          return prev + 5; // Increment progress
        });
      }, 400); // Simulate progress
    } else {
        setProgress(100); // Complete the bar on finish/error
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGeneratingAudio]);
  

  const handlePlayAudio = () => {
    const audioContext = getAudioContext();
    if (audioBuffer && audioContext) {
      if(audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      if (isPlaying) return;

      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
      setIsPlaying(true);
    }
  };

  const textToDisplay = selectedLang === 'en' ? result.en : result.ru;

  return (
    <div className="bg-gray-800 rounded-lg p-6 animate-fade-in space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-white">Analysis Result</h2>
        <div className="flex items-center space-x-2">
           <button
            onClick={handlePlayAudio}
            disabled={!audioBuffer || isPlaying || isGeneratingAudio}
            className="flex items-center justify-center p-2 bg-blue-500 rounded-full text-white hover:bg-blue-600 transition disabled:bg-gray-600 disabled:cursor-not-allowed"
            aria-label="Play audio summary"
          >
            <Volume2 size={20} />
          </button>
          <div className="flex items-center bg-gray-700 rounded-full p-1">
            <button
              onClick={() => setSelectedLang('en')}
              className={`px-3 py-1 text-sm rounded-full ${selectedLang === 'en' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
            >
              EN
            </button>
            <button
              onClick={() => setSelectedLang('ru')}
              className={`px-3 py-1 text-sm rounded-full ${selectedLang === 'ru' ? 'bg-blue-500 text-white' : 'text-gray-300'}`}
            >
              RU
            </button>
          </div>
        </div>
      </div>
       {(isGeneratingAudio || audioError) && (
        <div className="space-y-2">
          {isGeneratingAudio && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Generating audio summary...</span>
                <span className="text-gray-300">{progress}%</span>
              </div>
              <ProgressBar progress={progress} />
            </>
          )}
          {audioError && !isGeneratingAudio && (
            <p className="text-sm text-red-400">Could not generate audio: {audioError}</p>
          )}
        </div>
      )}
      <div className="prose prose-invert prose-p:text-gray-300 max-w-none overflow-y-auto pr-2 h-48 md:h-auto md:flex-grow">
        <p>{textToDisplay}</p>
      </div>
      {result.sources.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-md font-semibold text-gray-200 mb-2">Sources</h3>
          <ul className="space-y-1 text-sm max-h-24 overflow-y-auto">
            {result.sources.map((source, index) => {
              const info = source.web || source.maps;
              // FIX: Ensure info and info.uri exist before rendering the link.
              if (!info || !info.uri) return null;
              return (
                <li key={index}>
                  <a
                    href={info.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 hover:underline truncate"
                  >
                    <LinkIcon size={14} />
                    <span className="truncate">{info.title || 'Source Link'}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ResultCard;
