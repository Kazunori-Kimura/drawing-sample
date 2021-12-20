import { KonvaEventObject } from 'konva/lib/Node';
import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from 'react';
import { Structure } from '../../../types/shape';
import { clone, createBeam, createNode, snap } from '../util';

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
            const data = clone(structure);
            // 開始点
            const start = points.slice(0, 2);
            // 終了点
            const end = points.slice(-2);

            // スナップさせる
            const edgeI = snap([start[0], start[1]], snapSize);
            const edgeJ = snap([end[0], end[1]], snapSize);

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
