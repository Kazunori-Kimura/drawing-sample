import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import {
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Stage } from 'react-konva';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';
import { DOMSize } from '../../types/common';
import { PageProps, PageSize } from '../../types/note';
import { clone } from '../Canvas/util';
import Draw from './layer/Draw';
import Grid from './layer/Grid';

interface Props extends PageProps {
    viewBox: DOMSize;
    onChange: Dispatch<SetStateAction<PageProps>>;
}

const Page: React.VFC<Props> = ({ viewBox, size, drawings, onChange }) => {
    const stageRef = useRef<Konva.Stage>(null);
    const { mode, settings } = useContext(NoteSettingsContext);

    // 描画用
    const isDrawing = useRef<boolean>();
    const [points, setPoints] = useState<number[]>([]);

    const pageSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

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

    const handlePointerDown = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (mode !== 'edit') {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (stageRef.current && point) {
                isDrawing.current = true;

                const { x, y } = stageRef.current.getPosition();
                setPoints([point.x + Math.abs(x), point.y + Math.abs(y)]);
            }
        },
        [mode]
    );

    const handlePointerMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (mode !== 'edit') {
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
        [mode]
    );

    const handlePointerUp = useCallback(
        (_: KonvaEventObject<Event>) => {
            if (mode !== 'edit') {
                return;
            }
            if (!isDrawing.current) {
                return;
            }

            isDrawing.current = false;
            // 更新を確定
            onChange((page) => {
                const data = clone(page);
                // 描画データを追加
                data.drawings.push({
                    ...settings,
                    points,
                });

                return data;
            });
            // 現在の描画データをクリア
            setPoints([]);
        },
        [mode, onChange, points, settings]
    );

    return (
        <Stage
            ref={stageRef}
            width={viewBox.width}
            height={viewBox.height}
            draggable={mode === 'select'}
            onDragMove={handleDragMove}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <Grid size={size} />
            <Draw drawings={drawings} settings={settings} points={points} />
        </Stage>
    );
};

export default Page;
