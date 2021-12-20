import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Circle } from 'react-konva';
import { Node as NodeProps } from '../../../types/shape';
import { StructureContext } from '../provider/StructureProvider';
import { snap } from '../util';

interface Props extends NodeProps {
    draggable?: boolean;
    onChange: (node: NodeProps) => void;
}

const DrawInterval = 100;

const Node: React.VFC<Props> = ({ id, x, y, draggable = false, onChange }) => {
    const { snapSize } = useContext(StructureContext);
    const [isDragging, setIsDragging] = useState(false);
    const pointRef = useRef<Vector2d>({ x, y });

    const redraw = useCallback(() => {
        if (draggable) {
            const [px, py] = snap([pointRef.current.x, pointRef.current.y], snapSize);
            const node = { id, x: px, y: py };
            onChange(node);
        }
    }, [draggable, id, onChange, snapSize]);

    const handleDragStart = useCallback((event: KonvaEventObject<DragEvent>) => {
        const point = event.target.getStage()?.getPointerPosition();
        if (point) {
            pointRef.current = point;
            setIsDragging(true);
        }
    }, []);

    const handleDragMove = useCallback((event: KonvaEventObject<DragEvent>) => {
        const point = event.target.getStage()?.getPointerPosition();
        if (point) {
            pointRef.current = point;
        }
    }, []);

    const handleDragEnd = useCallback((event: KonvaEventObject<DragEvent>) => {
        const point = event.target.getStage()?.getPointerPosition();
        if (point) {
            pointRef.current = point;
            setIsDragging(false);
        }
    }, []);

    useEffect(() => {
        let timer: NodeJS.Timer | undefined;
        if (draggable) {
            redraw();

            if (isDragging) {
                timer = setInterval(redraw, DrawInterval);
            } else {
                if (timer) {
                    clearInterval(timer);
                    timer = undefined;
                }
            }
        }

        return () => {
            if (timer) {
                clearInterval(timer);
            }
        };
    }, [draggable, isDragging, redraw]);

    return (
        <Circle
            id={id}
            x={x}
            y={y}
            fill={isDragging ? 'blue' : 'black'}
            radius={4}
            draggable={draggable}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragEnd={handleDragEnd}
            _useStrictMode
        />
    );
};

export default Node;
