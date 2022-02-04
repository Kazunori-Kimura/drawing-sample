import { Box } from '@mui/material';
import { forwardRef, useContext, useEffect, useRef, useState } from 'react';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';
import { defaultPageProps } from '../../types/note';
import Page, { PageHandler } from './Page';

export type NoteHandler = PageHandler;

const Note: React.ForwardRefRenderFunction<NoteHandler> = (_, ref) => {
    // キャンバスの親要素
    const containerRef = useRef<HTMLDivElement>(null);
    // 表示領域
    const [viewSize, setViewSize] = useState<DOMRect>();

    const { mode, editCanvas, closeCanvas } = useContext(AppSettingsContext);
    const { mode: tool, settings } = useContext(NoteSettingsContext);

    // 要素のリサイズを監視
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const rect = entries[0].target.getBoundingClientRect();
            setViewSize(rect);
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
                overflow: 'hidden',
            }}
        >
            {viewSize && (
                <Page
                    ref={ref}
                    mode={mode}
                    tool={tool}
                    viewSize={viewSize}
                    drawSettings={settings}
                    onEditCanvas={editCanvas}
                    onCloseCanvas={closeCanvas}
                    {...defaultPageProps}
                />
            )}
        </Box>
    );
};

export default forwardRef(Note);
