# bun-whisper-cli
<img width="344" height="71" alt="image" src="https://github.com/user-attachments/assets/41055dcd-4996-438d-8327-3c3ac9d2521e" />

A fast, command-line audio transcriber built with Bun and Transformers.js. Features a polished TUI for OpenAI's Whisper model using [Ink](https://github.com/vadimdemedes/ink).

## Usage

```bash
bun install
bun start [file|url]
```

### Examples

```bash
# Transcribe a local file
bun start ./my-recording.wav

# Transcribe a remote URL
bun start https://example.com/audio.mp3

# Transcribe included samples
bun start ./samples/harvard.wav
bun start ./samples/jackhammer.wav
```

<img width="1328" height="431" alt="image" src="https://github.com/user-attachments/assets/5e499100-be8c-4532-b19f-3b9c25021129" />
