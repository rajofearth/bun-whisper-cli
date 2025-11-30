import React from 'react';
import { Box, Text, Newline } from 'ink';
import type { TranscriptionResult } from '../hooks/useTranscriber.js';

interface TranscriptProps {
    result: TranscriptionResult;
}

const formatTimestamp = (t: number | undefined | null): string => {
    if (t === undefined || t === null) return '...';
    const mins = Math.floor(t / 60).toString().padStart(2, '0');
    const secs = (t % 60).toFixed(2).padStart(5, '0');
    return `${mins}:${secs}`;
};

export const Transcript = ({ result }: TranscriptProps) => {
    return (
        <Box flexDirection="column" marginTop={1}>
            <Text bold underline>Full Transcript:</Text>
            <Box borderStyle="classic" borderColor="gray" padding={1} marginBottom={1}>
                <Text>{result.text.trim()}</Text>
            </Box>

            {result.chunks && result.chunks.length > 0 && (
                <Box flexDirection="column">
                    <Text bold underline>Segments:</Text>
                    <Box flexDirection="column" marginLeft={1}>
                        {result.chunks.map((chunk, i) => (
                            <Box key={i}>
                                <Text dimColor>
                                    [{formatTimestamp(chunk.timestamp[0])} {'->'} {formatTimestamp(chunk.timestamp[1])}]{' '}
                                </Text>
                                <Text>{chunk.text.trim()}</Text>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Box>
    );
};
