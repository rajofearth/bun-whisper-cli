import { Box, Text } from 'ink';
import { useTranscriber } from '../hooks/useTranscriber.js';
import { Header } from './Header.js';
import { Progress } from './Progress.js';
import { Transcript } from './Transcript.js';

interface AppProps {
    audioSource: string;
}

export const App = ({ audioSource }: AppProps) => {
    const state = useTranscriber(audioSource);

    return (
        <Box flexDirection="column" padding={1}>
            <Header />
            
            <Box marginBottom={1}>
                 <Text>Source: </Text>
                 <Text color="cyan">{audioSource}</Text>
            </Box>

            {state.status === 'error' ? (
                <Box borderStyle="double" borderColor="red" padding={1}>
                    <Text color="red" bold>Error: {state.error}</Text>
                </Box>
            ) : (
                <>
                    <Progress state={state} />
                    {state.status === 'completed' && (
                        <Transcript result={state.result} />
                    )}
                </>
            )}
        </Box>
    );
};