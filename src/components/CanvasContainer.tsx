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
                ml: 1,
                mb: 1,
                width: 'calc(100vw - 160px)',
                border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
        >
            <Canvas tool={tool} structure={structure} onChange={setStructure} />
        </Box>
    );
};

export default CanvasContainer;
