import { Box } from '@mui/material';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CanvasTool, DOMSize } from '../../types/common';
import { Structure } from '../../types/shape';
import CanvasCore, { CanvasProps } from './core';
import { PopupPosition, PopupType } from './popup/types';
import DrawProvider from './provider/DrawProvider';
import PopupProvider from './provider/PopupProvider';
import SelectProvider from './provider/SelectProvider';
import { CanvasCoreHandler, Shape } from './types';

interface Props extends Omit<CanvasProps, 'size' | 'tool' | 'setStructure'> {
    tool?: CanvasTool;
}

export interface CanvasHandler extends CanvasCoreHandler {
    getStructure: () => Structure;
}

const Canvas: React.ForwardRefRenderFunction<CanvasHandler, Props> = (
    { tool = 'select', structure: source, ...props },
    ref
) => {
    // キャンバス表示領域
    const [size, setSize] = useState<DOMSize>({ width: 0, height: 0 });
    // 選択要素
    const [selected, setSelected] = useState<Shape[]>([]);
    // ポップオーバーの表示
    const [popupType, setPopupType] = useState<PopupType>();
    const [popupPosition, setPopupPosition] = useState<PopupPosition>({ top: 0, left: 0 });
    // 描画する点
    const [points, setPoints] = useState<number[]>([]);
    // データ
    const [structure, setStructure] = useState(source);

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
            getStructure: () => structure,
        }),
        [structure]
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
            <PopupProvider value={{ popupType, setPopupType, popupPosition, setPopupPosition }}>
                <SelectProvider value={{ selected, setSelected }}>
                    <DrawProvider
                        value={{ points, setPoints, tool, structure, setStructure, ...props }}
                    >
                        <CanvasCore
                            ref={canvasRef}
                            size={size}
                            tool={tool}
                            structure={structure}
                            setStructure={setStructure}
                            {...props}
                        />
                    </DrawProvider>
                </SelectProvider>
            </PopupProvider>
        </Box>
    );
};

export default forwardRef(Canvas);
