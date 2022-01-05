import { Box } from '@mui/material';
import Note from './Note';

const NoteContainer: React.VFC = () => {
    return (
        <Box
            sx={{
                boxSizing: 'border-box',
                ml: 1,
                mb: 1,
                flex: 1,
                border: (theme) => `1px solid ${theme.palette.divider}`,
                borderRadius: 1,
                overflow: 'hidden',
            }}
        >
            <Note />
        </Box>
    );
};

export default NoteContainer;
