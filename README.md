# bun-whisper-cli

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