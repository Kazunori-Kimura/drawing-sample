import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DOMSize } from '../../types/common';
import { Structure } from '../../types/shape';
import data from '../../__test__/sample.json';
import CanvasCore from './core';

const Canvas: React.VFC = () => {
    const [size, setSize] = useState<DOMSize>({ width: 0, height: 0 });
    const parentRef = useRef<HTMLDivElement>(null);

    // 要素のりサイズを監視
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setSize({
                width,
                height,
            });
        });

        if (parentRef.current) {
            observer.observe(parentRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <Box ref={parentRef} sx={{ width: '100%', minHeight: '100%', backgroundColor: '#ffffff' }}>
            <CanvasCore structure={data as Structure} size={size} />
        </Box>
    );
};

export default Canvas;
