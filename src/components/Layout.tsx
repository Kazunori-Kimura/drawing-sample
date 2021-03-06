import { Box } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { DOMSize } from '../types/common';
import Header from './Header';
import MainContainer from './MainContainer';
import Toolbox from './Toolbox';

const Layout: React.VFC = () => {
    const [windowRect, setWindowRect] = useState<DOMSize>({ width: 0, height: 0 });

    const fitWindowSize = useCallback(() => {
        const { innerHeight, innerWidth } = window;
        setWindowRect({
            height: innerHeight,
            width: innerWidth,
        });
    }, []);

    useEffect(() => {
        fitWindowSize();
        window.addEventListener('resize', fitWindowSize);

        return () => {
            window.removeEventListener('resize', fitWindowSize);
        };
    }, [fitWindowSize]);

    return (
        <Box sx={{ ...windowRect, overflow: 'hidden' }}>
            <Header />
            <Box
                sx={{
                    boxSizing: 'border-box',
                    width: 'auto',
                    height: 'calc(100% - 48px)',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    alignItems: 'stretch',
                    pt: 1,
                    px: 1,
                }}
            >
                <Toolbox />
                <MainContainer />
            </Box>
        </Box>
    );
};

export default Layout;
