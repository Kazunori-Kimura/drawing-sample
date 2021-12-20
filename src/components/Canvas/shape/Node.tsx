import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Circle } from 'react-konva';
import { Node as NodeProps } from '../../../types/shape';
import { StructureContext } from '../provider/StructureProvider';
import { clone, replaceNode, snap } from '../util';

interface Props extends NodeProps {
    draggable?: boolean;
    onChange?: (node: NodeProps) => void;
    onCommit?: (node: NodeProps) => void;
}

const DrawInterval = 100;

const Node: React.VFC<Props> = ({ id, x, y, draggable = false, onChange, onCommit }) => {
    const [isDragging, setIsDragging] = useState(false);
    const pointRef = useRef<Vector2d>({ x, y });
    const timerRef = useRef<NodeJS.Timer>();

    const redraw = useCallback(() => {
        if (draggable) {
            const node: NodeProps = { id, x: pointRef.current.x, y: pointRef.current.y };
            onChange && onChange(node);
        }
    }, [draggable, id, onChange]);

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

    const handleDragEnd = useCallback(
        (event: KonvaEventObject<DragEvent>) => {
            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                pointRef.current = point;
                setIsDragging(false);
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = undefined;
                }

                // 節点のマージ処理
                const node: NodeProps = { id, x: pointRef.current.x, y: pointRef.current.y };
                onCommit && onCommit(node);
            }
        },
        [id, onCommit]
    );

    useEffect(() => {
        const timer = timerRef.current;
        if (draggable) {
            if (isDragging) {
                redraw();
                timerRef.current = setInterval(redraw, DrawInterval);
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

const ConnectedNode: React.VFC<NodeProps> = (props) => {
    const { tool, snapSize, setStructure } = useContext(StructureContext);

    const draggable = useMemo(() => {
        return tool !== 'pen' && Boolean(setStructure);
    }, [setStructure, tool]);

    const handleChange = useCallback(
        ({ id, x, y }: NodeProps) => {
            if (setStructure) {
                const [px, py] = snap([x, y], snapSize);
                setStructure((values) => {
                    const data = clone(values);
                    const node = data.nodes.find((item) => item.id === id);
                    if (node) {
                        node.x = px;
                        node.y = py;
                    }
                    return data;
                });
            }
        },
        [setStructure, snapSize]
    );

    const handleCommit = useCallback(
        ({ id, x, y }: NodeProps) => {
            if (setStructure) {
                const [px, py] = snap([x, y], snapSize);
                setStructure((values) => {
                    const data = clone(values);
                    // 該当ID の index
                    const index = data.nodes.findIndex((item) => item.id === id);
                    if (index >= 0) {
                        // 座標が一致する別の節点が存在する？
                        const node = data.nodes.find((item) => {
                            return item.id !== id && item.x === px && item.y === py;
                        });
                        if (node) {
                            // 現在の node を座標が一致する node に置き換える
                            replaceNode(data, id, node.id);
                            // 不要となった現在の node を削除する
                            data.nodes.splice(index, 1);
                        }
                    }

                    return data;
                });
            }
        },
        [setStructure, snapSize]
    );

    return (
        <Node {...props} draggable={draggable} onChange={handleChange} onCommit={handleCommit} />
    );
};

export default ConnectedNode;
