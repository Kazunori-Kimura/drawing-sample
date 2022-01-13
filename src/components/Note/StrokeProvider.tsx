import { KonvaEventObject } from 'konva/lib/Node';
import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { AppSettingsContext } from '../../providers/AppSettingsProvider';
import { NoteSettingsContext } from '../../providers/NoteSettingsProvider';

interface Props {
    children: ReactNode;
}

interface IStrokeContext {
    points: number[];
    onPointerDown: (event: KonvaEventObject<Event>) => void;
    onPointerMove: (event: KonvaEventObject<Event>) => void;
    onPointerUp: (event: KonvaEventObject<Event>) => void;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const StrokeContext = createContext<IStrokeContext>(undefined!);

const StrokeProvider: React.VFC<Props> = ({ children }) => {
    const isDrawing = useRef<boolean>();
    const [points, setPoints] = useState<number[]>([]);

    const { mode: appMode, addDrawing } = useContext(AppSettingsContext);
    const { mode: noteMode, settings } = useContext(NoteSettingsContext);

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

            const stage = event.target.getStage();
            if (stage) {
                isDrawing.current = true;
                const { x, y } = stage.getPosition();
                const point = stage.getPointerPosition();
                if (point) {
                    setPoints([point.x + Math.abs(x), point.y + Math.abs(y)]);
                }
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

            const stage = event.target.getStage();
            if (stage) {
                const { x, y } = stage.getPosition();
                const point = stage.getPointerPosition();
                if (point) {
                    setPoints((state) => [...state, point.x + Math.abs(x), point.y + Math.abs(y)]);
                }
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
        <StrokeContext.Provider
            value={{
                points,
                onPointerDown: handlePointerDown,
                onPointerMove: handlePointerMove,
                onPointerUp: handlePointerUp,
            }}
        >
            {children}
        </StrokeContext.Provider>
    );
};

export default StrokeProvider;
