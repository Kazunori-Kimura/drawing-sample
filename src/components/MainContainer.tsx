import { Box } from '@mui/material';
import { useContext } from 'react';
import { AppSettingsContext } from '../providers/AppSettingsProvider';
import { ConfigurationContext } from '../providers/ConfigurationProvider';
import Canvas from './Canvas';
import Note from './Note';

const MainContainer: React.VFC = () => {
    const { mode, canvasProps, canvasRef } = useContext(AppSettingsContext);
    const { tool } = useContext(ConfigurationContext);

    return (
        <Box
            sx={{
                position: 'relative',
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
            {canvasProps && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: canvasProps.coordinates.tl.y,
                        left: canvasProps.coordinates.tl.x,
                        width: canvasProps.width,
                        height: canvasProps.height,
                    }}
                >
                    <Canvas
                        ref={canvasRef}
                        tool={tool}
                        readonly={mode === 'note'}
                        {...canvasProps}
                    />
                </Box>
            )}
        </Box>
    );
};

export default MainContainer;
