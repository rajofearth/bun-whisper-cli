import { pipeline, env, type AutomaticSpeechRecognitionOutput } from '@huggingface/transformers';
import { WaveFile } from 'wavefile';
import ora from 'ora';
import chalk from 'chalk';
import boxen from 'boxen';

// --- Interfaces ---
interface ProgressData {
    status: 'initiate' | 'progress' | 'done';
    file: string;
    progress?: number;
    loaded?: number;
    total?: number;
    name?: string;
}

interface TranscriberOptions {
    chunk_length_s: number;
    stride_length_s: number;
    language: string;
    task: string;
    return_timestamps: boolean;
}

// --- Configuration ---
env.allowLocalModels = false;
const MODEL_NAME = 'Xenova/whisper-tiny';
const AUDIO_URL = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav';

// --- UI Helpers ---
const printBanner = (): void => {
    console.log(boxen(chalk.bold.cyan(' 🎙️  Bun Whisper Transcriber '), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
    }));
};

const formatTimestamp = (t: number | undefined | null): string => {
    if (t === undefined || t === null) return '...';
    // Format seconds to mm:ss.ms
    const mins = Math.floor(t / 60).toString().padStart(2, '0');
    const secs = (t % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
};

// --- Hack: Suppress specific "content-length" warnings quietly ---
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('content-length')) return;
    originalWarn(...args);
};

// --- Main Application ---
(async () => {
    printBanner();

    // 1. Initialize Model with a Spinner
    const spinner = ora('Initializing model pipeline...').start();
    
    // State tracking for parallel downloads
    const progressMap = new Map<string, number>();
    let lastRender = 0;

    // The pipeline function's types are inferred, but we can type the callback data
    const transcriber = await pipeline('automatic-speech-recognition', MODEL_NAME, {
        dtype: 'fp32',
        device: 'cpu',
        progress_callback: (data: ProgressData) => {
            const now = Date.now();
            
            // 1. Update State
            if (data.status === 'initiate') {
                progressMap.set(data.file, 0);
            } else if (data.status === 'progress') {
                // Normalize progress to 0-100 percentage
                const p = data.progress ?? 0;
                progressMap.set(data.file, p);
            } else if (data.status === 'done') {
                progressMap.delete(data.file);
            }

            // 2. Render State (Throttled to 100ms to prevent flickering/performance hits)
            // Always render on 'initiate' or 'done' to ensure immediate feedback for state changes
            if (data.status !== 'progress' || now - lastRender > 100) {
                lastRender = now;
                
                if (progressMap.size === 0) {
                     // If we are in between files or just starting
                    if (data.status === 'done') {
                         spinner.text = `Loaded ${chalk.green(data.file)}`;
                    } else {
                         spinner.text = 'Loading model components...';
                    }
                } else {
                    // Construct a stable summary string for parallel downloads
                    const parts = Array.from(progressMap.entries()).map(([file, prog]) => {
                        // Shorten filename to avoid wrapping: "onnx/decoder_model_merged.onnx" -> "decoder_model..."
                        const shortName = file.split('/').pop()?.split('.')[0] ?? file;
                        return `${chalk.blue(shortName)} ${chalk.yellow(prog.toFixed(0) + '%')}`;
                    });
                    
                    spinner.text = `Downloading: ${parts.join(chalk.dim(' | '))}`;
                }
            }
        },
    });

    spinner.succeed(chalk.green('Whisper model ready'));

    // 2. Load Audio
    spinner.start('Preparing audio...');
    let audioData: Float32Array;
    
    try {
        // Pass a callback to update the spinner during the distinct phases (Download vs Processing)
        audioData = await loadAudio(AUDIO_URL, (status) => {
            spinner.text = status;
        });
        spinner.succeed(chalk.green(`Audio loaded: ${chalk.dim('jfk.wav')} (16kHz Mono)`));
    } catch (e) {
        spinner.fail(chalk.red('Failed to load audio'));
        console.error(e);
        process.exit(1);
    }

    // 3. Transcribe
    spinner.start('Transcribing (Inference)...');
    const start = performance.now();

    const output = await transcriber(audioData, {
        chunk_length_s: 30,
        stride_length_s: 5,
        language: 'english',
        task: 'transcribe',
        return_timestamps: true,
    } as TranscriberOptions) as AutomaticSpeechRecognitionOutput; 
    // Explicit cast used here as the library return type can be complex/generic

    const end = performance.now();
    const duration = ((end - start) / 1000).toFixed(2);
    spinner.succeed(chalk.green(`Transcription complete in ${duration}s`));

    // 4. Output Results
    console.log(''); // spacer

    // Print Full Text
    console.log(chalk.bold('📜 Full Transcript:'));
    console.log(boxen(chalk.white(output.text.trim()), {
        padding: 1,
        borderStyle: 'classic',
        borderColor: 'gray'
    }));

    // Print Timestamps nicely
    // Check if chunks exist and are not empty. 
    // Note: The specific output shape depends on `return_timestamps: true`
    if (output.chunks && output.chunks.length > 0) {
        console.log(chalk.bold('⏱️  Segments:'));
        output.chunks.forEach((chunk) => {
            const tStart = formatTimestamp(chunk.timestamp[0]);
            const tEnd = formatTimestamp(chunk.timestamp[1]);
            
            console.log(
                chalk.dim('[') + 
                chalk.yellow(tStart) + 
                chalk.dim(' -> ') + 
                chalk.yellow(tEnd) + 
                chalk.dim('] ') + 
                chunk.text.trim()
            );
        });
    }
    console.log('');
})();

// --- Audio Helper Helper ---
async function loadAudio(url: string, onStatusUpdate?: (msg: string) => void): Promise<Float32Array> {
    if (onStatusUpdate) onStatusUpdate(`Downloading audio from source...`);
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    
    if (onStatusUpdate) onStatusUpdate('Processing audio (Resampling & Converting)...');
    
    // YIELD TO EVENT LOOP: This 1ms delay allows the spinner to render the "Processing" text
    // before the heavy synchronous WaveFile operations block the main thread.
    await new Promise(resolve => setTimeout(resolve, 10));

    const wav = new WaveFile(new Uint8Array(buffer));
    wav.toBitDepth('32f'); 
    wav.toSampleRate(16000); 
    
    let audioData = wav.getSamples();
    
    if (Array.isArray(audioData)) {
        if (audioData.length > 1) {
            // Stereo to Mono
            audioData = audioData[0];
        } else {
            audioData = audioData[0];
        }
    }
    
    // Ensure we are returning a Float32Array (WaveFile can return various types based on bit depth)
    return audioData as unknown as Float32Array;
}
