import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useMemo, useRef } from 'react';
import { Stage } from 'react-konva';
import { useContextBridge } from '../../hooks/useContextBridge';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import { ConfigurationContext } from '../../providers/ConfigurationProvider';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';
import { DOMSize } from '../../types/common';
import Draw from './layer/Draw';
import Frame from './layer/Frame';
import Grid from './layer/Grid';
import { StrokeContext } from './StrokeProvider';

interface Props {
    viewBox: DOMSize;
}

const Page: React.VFC<Props> = ({ viewBox }) => {
    const stageRef = useRef<Konva.Stage>(null);
    const { mode: noteMode } = useContext(NoteSettingsContext);
    const { mode: appMode, pageSize } = useContext(AppSettingsContext);
    const { onPointerDown, onPointerUp, onPointerMove } = useContext(StrokeContext);

    // Stage 以降で使用する Context を Bridge する
    const ContextBridge = useContextBridge(
        AppSettingsContext,
        ConfigurationContext,
        NoteSettingsContext,
        StrokeContext
    );

    const draggable = useMemo(() => {
        return appMode === 'note' && noteMode === 'select';
    }, [appMode, noteMode]);

    /**
     * ページサイズの範囲で表示領域を移動する
     */
    const handleDragMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            const { x, y } = event.target.attrs;
            if (stageRef.current && typeof x === 'number' && typeof y === 'number') {
                let [newX, newY] = [x, y];
                let modified = false;

                if (newX > 0) {
                    newX = 0;
                    modified = true;
                } else if (Math.abs(newX) + viewBox.width > pageSize.width) {
                    newX = viewBox.width - pageSize.width;
                    modified = true;
                }

                if (newY > 0) {
                    newY = 0;
                    modified = true;
                } else if (Math.abs(newY) + viewBox.height > pageSize.height) {
                    newY = viewBox.height - pageSize.height;
                    modified = true;
                }

                if (modified) {
                    stageRef.current.setPosition({ x: newX, y: newY });
                }
            }
        },
        [pageSize.height, pageSize.width, viewBox.height, viewBox.width]
    );

    return (
        <Stage
            ref={stageRef}
            width={viewBox.width}
            height={viewBox.height}
            draggable={draggable}
            onDragMove={handleDragMove}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            listening={appMode === 'note'}
        >
            <ContextBridge>
                <Grid pageSize={pageSize} />
                <Frame draggable={draggable} />
                <Draw />
            </ContextBridge>
        </Stage>
    );
};

export default Page;
