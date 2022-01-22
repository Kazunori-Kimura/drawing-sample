import { Box } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CanvasTool, DOMSize } from '../../types/common';
import { defaultCanvasProps, StructureCanvasProps } from '../../types/note';
import CanvasCore from './core';
import Popup from './popup';
import PopupProvider from './provider/PopupProvider';
import { CanvasCoreHandler } from './types';

interface Props extends StructureCanvasProps {
    readonly?: boolean;
    tool?: CanvasTool;
}

export type CanvasHandler = CanvasCoreHandler;

const Canvas: React.ForwardRefRenderFunction<CanvasHandler, Props> = (
    { tool = 'select', readonly = false, children, ...props },
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
            toDataURL: canvasRef.current?.toDataURL ?? (() => 'hoge'),
            getStructure: canvasRef.current?.getStructure ?? (() => defaultCanvasProps),
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
            <PopupProvider>
                <CanvasCore ref={canvasRef} tool={tool} readonly={readonly} {...size} {...props} />
                <Popup />
            </PopupProvider>
        </Box>
    );
};

export default forwardRef(Canvas);
