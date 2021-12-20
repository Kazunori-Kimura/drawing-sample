import { KonvaEventObject } from 'konva/lib/Node';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Structure } from '../../../types/shape';
import { createBeam, createNode, snap } from '../util';

interface StageEventHandlers {
    onPointerDown: (event: KonvaEventObject<PointerEvent>) => void;
    onPointerMove: (event: KonvaEventObject<PointerEvent>) => void;
    onPointerUp: (event: KonvaEventObject<PointerEvent>) => void;
}

interface HookProps {
    disabled?: boolean;
    snapSize?: number;
    structure: Structure;
    setStructure?: Dispatch<SetStateAction<Structure>>;
}

interface HookResponse extends StageEventHandlers {
    points: number[];
}

export const useDraw = ({
    disabled = false,
    snapSize = 25,
    structure,
    setStructure,
}: HookProps): HookResponse => {
    const [points, setPoints] = useState<number[]>([]);
    const isDrawing = useRef(false);

    const handlePointerDown = useCallback(
        (event: KonvaEventObject<PointerEvent>) => {
            if (disabled) {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                isDrawing.current = true;
                setPoints([point.x, point.y]);
            }
        },
        [disabled]
    );

    const handlePointerMove = useCallback(
        (event: KonvaEventObject<PointerEvent>) => {
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
        [disabled]
    );

    const handlePointerUp = useCallback(() => {
        if (disabled) {
            return;
        }

        isDrawing.current = false;

        if (setStructure && points.length >= 4) {
            const data = JSON.parse(JSON.stringify(structure)) as Structure;
            // 開始点
            const start = points.slice(0, 2);
            // 終了点
            const end = points.slice(-2);

            // スナップさせる
            const edgeI = snap([start[0], start[1]], snapSize);
            const edgeJ = snap([end[0], end[1]], snapSize);

            const nodeI = createNode(...edgeI);
            const nodeJ = createNode(...edgeJ);
            data.nodes.push(nodeI, nodeJ);

            const name = `Beam_${data.beams.length + 1}`;
            const beam = createBeam(name, nodeI.id, nodeJ.id);
            data.beams.push(beam);

            setStructure(data);
            setPoints([]);
        }
    }, [disabled, points, setStructure, snapSize, structure]);

    useEffect(() => {
        if (disabled) {
            // 無効になったら描画中の線を消去
            setPoints([]);
        }
    }, [disabled]);

    return {
        points,
        onPointerDown: handlePointerDown,
        onPointerMove: handlePointerMove,
        onPointerUp: handlePointerUp,
    };
};
