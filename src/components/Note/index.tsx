import { Box } from '@mui/material';
import { useContext, useEffect, useRef, useState } from 'react';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';
import { DOMSize } from '../../types/common';
import { defaultPageProps } from '../../types/note';
import Page from './Page';

const Note: React.VFC = () => {
    // キャンバスの親要素
    const containerRef = useRef<HTMLDivElement>(null);
    // 表示領域
    const [viewSize, setViewSize] = useState<DOMSize>({ width: 0, height: 0 });

    const { mode } = useContext(AppSettingsContext);
    const { mode: tool, settings } = useContext(NoteSettingsContext);

    // 要素のリサイズを監視
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setViewSize({
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
                overflow: 'hidden',
            }}
        >
            <Page
                mode={mode}
                tool={tool}
                viewSize={viewSize}
                drawSettings={settings}
                {...defaultPageProps}
            />
        </Box>
    );
};

export default Note;
