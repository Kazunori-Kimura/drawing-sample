import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Stage } from 'react-konva';
import { useContextBridge } from '../../hooks/useContextBridge';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import { ConfigurationContext } from '../../providers/ConfigurationProvider';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';
import { DOMSize } from '../../types/common';
import Draw from './layer/Draw';
import Frame from './layer/Frame';
import Grid from './layer/Grid';

interface Props {
    viewBox: DOMSize;
}

const Page: React.VFC<Props> = ({ viewBox }) => {
    const stageRef = useRef<Konva.Stage>(null);
    const { mode: noteMode, settings } = useContext(NoteSettingsContext);
    const { mode: appMode, pageSize, drawings, addDrawing } = useContext(AppSettingsContext);

    // Stage 以降で使用する Context を Bridge する
    const ContextBridge = useContextBridge(
        AppSettingsContext,
        ConfigurationContext,
        NoteSettingsContext
    );

    // 描画用
    const isDrawing = useRef<boolean>();
    const [points, setPoints] = useState<number[]>([]);

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

    /**
     * 描画の開始
     */
    const handlePointerDown = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (appMode !== 'note') {
                return;
            }
            if (noteMode !== 'edit') {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (stageRef.current && point) {
                isDrawing.current = true;

                const { x, y } = stageRef.current.getPosition();
                setPoints([point.x + Math.abs(x), point.y + Math.abs(y)]);
            }
        },
        [appMode, noteMode]
    );

    /**
     * ポインタの移動時に位置を取得
     */
    const handlePointerMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (noteMode !== 'edit') {
                return;
            }
            if (!isDrawing.current) {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (stageRef.current && point) {
                const { x, y } = stageRef.current.getPosition();
                setPoints((state) => [...state, point.x + Math.abs(x), point.y + Math.abs(y)]);
            }
        },
        [noteMode]
    );

    /**
     * 描画の確定
     */
    const handlePointerUp = useCallback(
        (_: KonvaEventObject<Event>) => {
            if (appMode !== 'note') {
                return;
            }
            if (noteMode !== 'edit') {
                return;
            }
            if (!isDrawing.current) {
                return;
            }

            isDrawing.current = false;
            // 更新を確定
            addDrawing({
                points,
                ...settings,
            });

            // 現在の描画データをクリア
            setPoints([]);
        },
        [addDrawing, appMode, noteMode, points, settings]
    );

    return (
        <Stage
            ref={stageRef}
            width={viewBox.width}
            height={viewBox.height}
            draggable={draggable}
            onDragMove={handleDragMove}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <ContextBridge>
                <Grid pageSize={pageSize} />
                <Frame draggable={draggable} />
                <Draw drawings={drawings} settings={settings} points={points} />
            </ContextBridge>
        </Stage>
    );
};

export default Page;
