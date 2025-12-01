import { useState, useEffect, useCallback } from 'react';
import { pipeline, env, type AutomaticSpeechRecognitionOutput } from '@huggingface/transformers';
import { loadAudio } from '../utils/audio.js';

// Configuration
env.allowLocalModels = true;
const MODEL_NAME = 'Xenova/whisper-tiny';

// --- Hack: Suppress specific "content-length" warnings quietly ---
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('content-length')) return;
    originalWarn(...args);
};

export interface ProgressItem {
    file: string;
    progress: number;
}

export interface TranscriptionResult {
    text: string;
    chunks?: { timestamp: [number, number]; text: string }[];
}

export type AppState = 
    | { status: 'idle' }
    | { status: 'loading_model'; progress: ProgressItem[] }
    | { status: 'loading_audio'; message: string }
    | { status: 'transcribing'; startTime: number }
    | { status: 'completed'; result: TranscriptionResult; duration: string; error?: never }
    | { status: 'error'; error: string };

export function useTranscriber(audioSource: string) {
    const [state, setState] = useState<AppState>({ status: 'idle' });

    const startTranscription = useCallback(async () => {
        if (!audioSource) return;

        try {
            // 1. Load Model
            setState({ status: 'loading_model', progress: [] });

            // Helper to update progress map
            const progressMap = new Map<string, number>();
            
            const updateProgress = (file: string, progress: number, done: boolean) => {
                if (done) {
                    progressMap.delete(file);
                } else {
                    progressMap.set(file, progress);
                }
                
                const progressList: ProgressItem[] = Array.from(progressMap.entries()).map(([f, p]) => ({
                    file: f,
                    progress: p
                }));
                
                setState({ status: 'loading_model', progress: progressList });
            };

            const transcriber = await pipeline('automatic-speech-recognition', MODEL_NAME, {
                dtype: 'fp32',
                device: 'cpu',
                progress_callback: (data: any) => {
                    if (data.status === 'initiate') {
                        updateProgress(data.file, 0, false);
                    } else if (data.status === 'progress') {
                        updateProgress(data.file, data.progress ?? 0, false);
                    } else if (data.status === 'done') {
                        updateProgress(data.file, 100, true);
                    }
                },
            });

            // 2. Load Audio
            setState({ status: 'loading_audio', message: 'Loading...' });
            const audioData = await loadAudio(audioSource, (msg) => {
                 setState({ status: 'loading_audio', message: msg });
            });

            // 3. Transcribe
            const start = performance.now();
            setState({ status: 'transcribing', startTime: start });

            const output = await transcriber(audioData, {
                chunk_length_s: 30,
                stride_length_s: 5,
                language: 'english',
                task: 'transcribe',
                return_timestamps: true,
            }) as AutomaticSpeechRecognitionOutput;

            const end = performance.now();
            const duration = ((end - start) / 1000).toFixed(2);

            setState({ 
                status: 'completed', 
                result: { text: output.text, chunks: output.chunks as any }, 
                duration 
            });

        } catch (err: any) {
            setState({ status: 'error', error: err.message || 'Unknown error occurred' });
        }
    }, [audioSource]);

    // Auto-start on mount
    useEffect(() => {
        startTranscription();
    }, [startTranscription]);

    return state;
}