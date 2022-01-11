import { Box } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CanvasTool, DOMSize } from '../../types/common';
import { emptyStructure, Structure } from '../../types/shape';
import CanvasCore from './core';
import CanvasProvider from './provider/CanvasProvider';
import { CanvasCoreHandler } from './types';

interface Props {
    structure: Structure;
    tool?: CanvasTool;
    readonly?: boolean;
}

export type CanvasHandler = CanvasCoreHandler;

const Canvas: React.ForwardRefRenderFunction<CanvasHandler, Props> = (
    { tool = 'select', structure: source, readonly = false },
    ref
) => {
    // キャンバス表示領域
    const [size, setSize] = useState<DOMSize>({ width: 0, height: 0 });
    // キャンバスの親要素
    const containerRef = useRef<HTMLDivElement>(null);
    // キャンバス本体
    const canvasRef = useRef<CanvasCoreHandler>(null);

    useImperativeHandle(
        ref,
        () => ({
            toDataURL: () => {
                if (canvasRef.current) {
                    return canvasRef.current.toDataURL();
                }
            },
            getStructure: () => {
                if (canvasRef.current) {
                    return canvasRef.current.getStructure();
                }
                return emptyStructure;
            },
        }),
        []
    );

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
            <CanvasProvider tool={tool} size={size} structure={source} readonly={readonly}>
                <CanvasCore ref={canvasRef} />
            </CanvasProvider>
        </Box>
    );
};

export default forwardRef(Canvas);
