import { Box } from '@mui/material';
import { useContext, useState } from 'react';
import { ConfigurationContext } from '../providers/ConfigurationProvider';
import { emptyStructure } from '../types/shape';
import Canvas from './Canvas';

const CanvasContainer: React.VFC = () => {
    const { tool } = useContext(ConfigurationContext);
    const [structure, setStructure] = useState(emptyStructure);

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
            <Canvas tool={tool} structure={structure} onChange={setStructure} />
        </Box>
    );
};

export default CanvasContainer;
