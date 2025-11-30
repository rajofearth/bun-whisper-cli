import React from 'react';
import { render } from 'ink';
import meow from 'meow';
import { App } from './src/components/App.js';

const cli = meow(`
    Usage
      $ bun start <file|url>

    Options
      --help          Show help

    Examples
      $ bun start jfk.wav
      $ bun start https://example.com/audio.wav
`, {
    importMeta: import.meta,
});

const DEFAULT_AUDIO = 'https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav';
const audioSource = cli.input[0] || DEFAULT_AUDIO;

render(<App audioSource={audioSource} />);
