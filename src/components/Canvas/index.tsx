import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { CanvasTool, DOMSize } from '../../types/common';
import CanvasCore, { CanvasProps } from './core';
import { PopupPosition, PopupType } from './popup/types';
import PopupProvider from './provider/PopupProvider';
import SelectProvider from './provider/SelectProvider';
import { Shape } from './types';

interface Props extends Omit<CanvasProps, 'size' | 'tool'> {
    tool?: CanvasTool;
}

const Canvas: React.VFC<Props> = ({ tool = 'select', ...props }) => {
    // キャンバス表示領域
    const [size, setSize] = useState<DOMSize>({ width: 0, height: 0 });
    // 選択要素
    const [selected, setSelected] = useState<Shape[]>([]);
    // ポップオーバーの表示
    const [popupType, setPopupType] = useState<PopupType>();
    const [popupPosition, setPopupPosition] = useState<PopupPosition>({ top: 0, left: 0 });
    // キャンバスの親要素
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
            <PopupProvider value={{ popupType, setPopupType, popupPosition, setPopupPosition }}>
                <SelectProvider value={{ selected, setSelected }}>
                    <CanvasCore size={size} tool={tool} {...props} />
                </SelectProvider>
            </PopupProvider>
        </Box>
    );
};

export default Canvas;
