import { KonvaEventObject } from 'konva/lib/Node';
import {
    createContext,
    Dispatch,
    ReactNode,
    SetStateAction,
    useCallback,
    useMemo,
    useRef,
} from 'react';
import { CanvasProps } from '../core';
import { clone, createBeam, createNode, DEFAULT_SNAP_SIZE, snap } from '../util';

interface DrawEventHandlers {
    onPointerDown: (event: KonvaEventObject<Event>) => void;
    onPointerMove: (event: KonvaEventObject<Event>) => void;
    onPointerUp: (event: KonvaEventObject<Event>) => void;
}

interface DrawContextValue extends Omit<CanvasProps, 'size'> {
    points: number[];
    setPoints: Dispatch<SetStateAction<number[]>>;
}

type IDrawContext = DrawContextValue & DrawEventHandlers;

interface Props {
    value: DrawContextValue;
    children: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const DrawContext = createContext<IDrawContext>(undefined!);

const DrawProvider: React.VFC<Props> = ({
    value: { tool, readonly, points, setPoints, structure, setStructure },
    children,
}) => {
    const isDrawing = useRef(false);

    const disabled = useMemo(() => {
        if (!readonly) {
            return !(tool === 'pen' || tool === 'trapezoid');
        }
        return true;
    }, [readonly, tool]);

    const handlePointerDown = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (disabled) {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                isDrawing.current = true;
                setPoints([point.x, point.y]);
            }
        },
        [disabled, setPoints]
    );

    const handlePointerMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (disabled) {
                return;
            }
            if (!isDrawing.current) {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                isDrawing.current = true;
                setPoints((state) => [...state, point.x, point.y]);
            }
        },
        [disabled, setPoints]
    );

    const handlePointerUp = useCallback(() => {
        if (disabled) {
            return;
        }

        isDrawing.current = false;

        // tool === 'pen' の場合
        if (setStructure && points.length >= 4) {
            // 開始点
            const start = points.slice(0, 2);
            // 終了点
            const end = points.slice(-2);

            // スナップさせる
            const edgeI = snap([start[0], start[1]], DEFAULT_SNAP_SIZE);
            const edgeJ = snap([end[0], end[1]], DEFAULT_SNAP_SIZE);

            setStructure((structure) => {
                const data = clone(structure);
                const nodeI = createNode(...edgeI);
                // 同一座標の節点が存在するか？
                const n1 = data.nodes.find((node) => node.x === nodeI.x && node.y === nodeI.y);
                if (n1) {
                    // 既存の節点を使用する
                    nodeI.id = n1.id;
                } else {
                    // 新規追加
                    data.nodes.push(nodeI);
                }

                const nodeJ = createNode(...edgeJ);
                const n2 = data.nodes.find((node) => node.x === nodeJ.x && node.y === nodeJ.y);
                if (n2) {
                    // 既存の節点を使用する
                    nodeJ.id = n2.id;
                } else {
                    // 新規追加
                    data.nodes.push(nodeJ);
                }

                const name = `Beam_${data.beams.length + 1}`;
                const beam = createBeam(name, nodeI.id, nodeJ.id);
                data.beams.push(beam);

                return data;
            });

            setPoints([]);
        }
    }, [disabled, points, setPoints, setStructure]);

    return (
        <DrawContext.Provider
            value={{
                tool,
                readonly,
                points,
                setPoints,
                structure,
                setStructure,
                onPointerDown: handlePointerDown,
                onPointerMove: handlePointerMove,
                onPointerUp: handlePointerUp,
            }}
        >
            {children}
        </DrawContext.Provider>
    );
};

export default DrawProvider;
