import { Box } from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

export const Header = () => {
    return (
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
            <Gradient name="pastel">
                <BigText text="Bun Whisper" font="tiny" />
            </Gradient>
        </Box>
    );
};
