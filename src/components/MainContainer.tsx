import { Box } from '@mui/material';
import { useContext, useMemo } from 'react';
import { AppSettingsContext } from '../providers/AppSettingsProvider';
import { ConfigurationContext } from '../providers/ConfigurationProvider';
import { emptyStructure } from '../types/shape';
import Canvas from './Canvas';
import Note from './Note';

const MainContainer: React.VFC = () => {
    const { structures, selectedCanvasIndex, canvasProps, canvasRef } =
        useContext(AppSettingsContext);
    const { tool } = useContext(ConfigurationContext);

    const structure = useMemo(() => {
        if (typeof selectedCanvasIndex === 'number') {
            return structures[selectedCanvasIndex].data;
        }
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
                    <Canvas ref={canvasRef} tool={tool} structure={structure ?? emptyStructure} />
                </Box>
            )}
        </>
    );
};

export default MainContainer;
