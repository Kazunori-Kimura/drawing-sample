import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useEffect, useRef, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { Beam, Node, Structure } from '../../../types/shape';

interface StageEventHandlers {
    onMouseDown: (event: KonvaEventObject<MouseEvent>) => void;
    onMouseMove: (event: KonvaEventObject<MouseEvent>) => void;
    onMouseUp: (event: KonvaEventObject<MouseEvent>) => void;
}

interface HookProps {
    disabled?: boolean;
    structure: Structure;
    onChange?: (structure: Structure) => void;
}

interface HookResponse extends StageEventHandlers {
    points: number[];
}

const createNode = (x: number, y: number): Node => {
    return {
        id: uuid(),
        x,
        y,
    };
};
const createBeam = (name: string, nodeI: string, nodeJ: string): Beam => {
    return {
        id: uuid(),
        name,
        nodeI,
        nodeJ,
    };
};

export const useDraw = ({ disabled = false, structure, onChange }: HookProps): HookResponse => {
    const [points, setPoints] = useState<number[]>([]);
    const isDrawing = useRef(false);

    const handleMouseDown = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
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

    const handleMouseMove = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
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

    const handleMouseUp = useCallback(() => {
        if (disabled) {
            return;
        }

        isDrawing.current = false;

        if (onChange && points.length >= 4) {
            const data = JSON.parse(JSON.stringify(structure)) as Structure;
            // 開始点
            const start = points.slice(0, 2);
            // 終了点
            const end = points.slice(-2);

            const nodeI = createNode(start[0], start[1]);
            const nodeJ = createNode(end[0], end[1]);
            data.nodes.push(nodeI, nodeJ);

            const name = `Beam_${data.beams.length + 1}`;
            const beam = createBeam(name, nodeI.id, nodeJ.id);
            data.beams.push(beam);

            onChange(data);
            setPoints([]);
        }
    }, [disabled, onChange, points, structure]);

    useEffect(() => {
        if (disabled) {
            // 無効になったら描画中の線を消去
            setPoints([]);
        }
    }, [disabled]);

    return {
        points,
        onMouseDown: handleMouseDown,
        onMouseMove: handleMouseMove,
        onMouseUp: handleMouseUp,
    };
};
