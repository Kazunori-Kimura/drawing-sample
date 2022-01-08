import { Box } from '@mui/material';
import { useContext } from 'react';
import { AppSettingsContext } from '../providers/AppSettingsProvider';
import Note from './Note';

const MainContainer: React.VFC = () => {
    const { canvasProps } = useContext(AppSettingsContext);

    return (
        <>
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
            {canvasProps && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: canvasProps.y,
                        left: canvasProps.x,
                        width: canvasProps.width,
                        height: canvasProps.height,
                        backgroundColor: 'red',
                    }}
                >
                    HOHOHO!!!
                </Box>
            )}
        </>
    );
};

export default MainContainer;
