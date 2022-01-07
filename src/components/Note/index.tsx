import { Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { DOMSize } from '../../types/common';
import { defaultPageProps, PageProps } from '../../types/note';
import Page from './Page';

const Note: React.VFC = () => {
    // キャンバスの親要素
    const containerRef = useRef<HTMLDivElement>(null);
    // 表示領域
    const [viewBox, setViewBox] = useState<DOMSize>({ width: 0, height: 0 });
    // ページデータ
    const [pageProps, setPageProps] = useState<PageProps>(defaultPageProps);

    // 要素のリサイズを監視
    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setViewBox({
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
            <Page viewBox={viewBox} {...pageProps} onChange={setPageProps} />
        </Box>
    );
};

export default Note;
