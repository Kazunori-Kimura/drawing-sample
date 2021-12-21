import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { CanvasTool, DOMSize } from '../../types/common';
import CanvasCore, { CanvasProps } from './core';
import SelectProvider from './provider/SelectProvider';
import { Shape } from './types';

interface Props extends Omit<CanvasProps, 'size' | 'tool'> {
    tool?: CanvasTool;
}

const Canvas: React.VFC<Props> = ({ tool = 'select', ...props }) => {
    const [size, setSize] = useState<DOMSize>({ width: 0, height: 0 });
    const [selected, setSelected] = useState<Shape[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);

    // 要素のリサイズを監視
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setSize({
                width,
                height,
            });
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    return (
        <Box
            ref={containerRef}
            sx={{
                width: 'auto',
                height: '100%',
                backgroundColor: '#ffffff',
                overscrollBehavior: 'contain',
            }}
        >
            <SelectProvider value={{ selected, setSelected }}>
                <CanvasCore size={size} tool={tool} {...props} />
            </SelectProvider>
        </Box>
    );
};

export default Canvas;
