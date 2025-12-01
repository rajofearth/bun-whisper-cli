import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import type { AppState, ProgressItem } from '../hooks/useTranscriber.js';

interface ProgressProps {
    state: AppState;
}

const StatusRow = ({ label, status, detail, isActive }: { label: string, status: 'pending' | 'loading' | 'done' | 'error', detail?: string, isActive?: boolean }) => {
    let icon = <Text color="gray">○</Text>;
    let color = "gray";

    if (status === 'loading') {
        icon = <Text color="yellow"><Spinner type="dots" /></Text>;
        color = "yellow";
    } else if (status === 'done') {
        icon = <Text color="green">✔</Text>;
        color = "green";
    } else if (status === 'error') {
        icon = <Text color="red">✖</Text>;
        color = "red";
    }

    return (
        <Box flexDirection="row" gap={1}>
            <Box width={2}>{icon}</Box>
            <Box width={15}><Text color={color} bold={isActive}>{label}</Text></Box>
            <Box>{detail ? <Text color={isActive ? "white" : "gray"}>{detail}</Text> : null}</Box>
        </Box>
    );
};

export const Progress = ({ state }: ProgressProps) => {
    
    // Model Loading Logic
    let modelStatus: 'pending' | 'loading' | 'done' = 'pending';
    let modelDetail = '';
    if (state.status === 'loading_model') {
        modelStatus = 'loading';
        if (state.progress.length > 0) {
            modelDetail = state.progress.map(p => `${p.file.split('/').pop()?.slice(0, 15)}... (${p.progress.toFixed(0)}%)`).join(' | ');
        } else {
            modelDetail = 'Initializing...';
        }
    } else if (state.status !== 'idle' && state.status !== 'error') {
        modelStatus = 'done';
        modelDetail = 'Ready';
    }

    // Audio Loading Logic
    let audioStatus: 'pending' | 'loading' | 'done' = 'pending';
    let audioDetail = '';
    if (state.status === 'loading_audio') {
        audioStatus = 'loading';
        audioDetail = state.message;
    } else if (['transcribing', 'completed'].includes(state.status)) {
        audioStatus = 'done';
        audioDetail = 'Loaded (16kHz Mono)';
    } else if (state.status === 'loading_model' || state.status === 'idle') {
         audioStatus = 'pending';
    }

    // Transcription Logic
    let transStatus: 'pending' | 'loading' | 'done' = 'pending';
    let transDetail = '';
    if (state.status === 'transcribing') {
        transStatus = 'loading';
        transDetail = 'Processing...';
    } else if (state.status === 'completed') {
        transStatus = 'done';
        transDetail = `Completed in ${state.duration}s`;
    }

    return (
        <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
            <StatusRow 
                label="Model" 
                status={modelStatus} 
                detail={modelDetail} 
                isActive={state.status === 'loading_model'} 
            />
            <StatusRow 
                label="Audio" 
                status={audioStatus} 
                detail={audioDetail}
                isActive={state.status === 'loading_audio'}
            />
            <StatusRow 
                label="Transcribe" 
                status={transStatus} 
                detail={transDetail}
                isActive={state.status === 'transcribing'}
            />
        </Box>
    );
};
