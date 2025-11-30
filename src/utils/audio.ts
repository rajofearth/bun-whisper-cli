import { WaveFile } from 'wavefile';

export async function loadAudio(source: string, onStatusUpdate?: (msg: string) => void): Promise<Float32Array> {
    let buffer: ArrayBuffer;

    if (source.startsWith('http://') || source.startsWith('https://')) {
        if (onStatusUpdate) onStatusUpdate(`Downloading audio from URL...`);
        const response = await fetch(source);
        if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
        buffer = await response.arrayBuffer();
    } else {
        if (onStatusUpdate) onStatusUpdate(`Loading local audio file...`);
        const file = Bun.file(source);
        if (!await file.exists()) throw new Error(`File not found: ${source}`);
        buffer = await file.arrayBuffer();
    }
    
    if (onStatusUpdate) onStatusUpdate('Processing audio (Resampling & Converting)...');
    
    // YIELD TO EVENT LOOP: This 1ms delay allows the UI to render the "Processing" text
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
    
    // Ensure we are returning a Float32Array
    return audioData as unknown as Float32Array;
}