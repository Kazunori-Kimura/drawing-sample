import { Box } from '@mui/material';
import { useContext, useMemo } from 'react';
import { AppSettingsContext } from '../providers/AppSettingsProvider';
import { ConfigurationContext } from '../providers/ConfigurationProvider';
import { defaultCanvasProps } from '../types/note';
import Canvas from './Canvas';
import Note from './Note';

const MainContainer: React.VFC = () => {
    const { structures, selectedCanvasIndex, canvasProps, canvasRef } =
        useContext(AppSettingsContext);
    const { tool } = useContext(ConfigurationContext);

    const data = useMemo(() => {
        if (typeof selectedCanvasIndex === 'number') {
            return structures[selectedCanvasIndex];
        }
        return defaultCanvasProps;
    }, [selectedCanvasIndex, structures]);

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
                    maxWidth: 1000,
                    maxHeight: 1000,
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
                    }}
                >
                    <Canvas ref={canvasRef} tool={tool} {...data} />
                </Box>
            )}
        </>
    );
};

export default MainContainer;
