import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Image } from 'react-konva';
import useImage from 'use-image';
import { CanvasTool } from '../../../types/common';
import { Node as NodeProps, NodePinType } from '../../../types/shape';
import { PopupParams, PopupPosition } from '../popup/types';
import { PopupContext } from '../provider/PopupProvider';
import { StructureContext } from '../provider/StructureProvider';
import { clone, replaceNode, snap } from '../util';

interface Props extends NodeProps {
    tool: CanvasTool;
    draggable?: boolean;
    onChange?: (node: NodeProps) => void;
    onCommit?: (node: NodeProps) => void;
    onEdit: (position: PopupPosition) => void;
}

const Pins: Record<NodePinType, string> = {
    free: '/assets/images/pins/pin_1.svg', // とりあえずダミーで指定
    pin: '/assets/images/pins/pin_1.svg',
    pinX: '/assets/images/pins/pin_2.svg',
    pinZ: '/assets/images/pins/pin_2.svg',
    fixX: '/assets/images/pins/pin_3.svg',
    fix: '/assets/images/pins/pin_4.svg',
};

const DrawInterval = 100;

const Node: React.VFC<Props> = ({
    id,
    x,
    y,
    pin = 'free',
    tool,
    draggable = false,
    onChange,
    onCommit,
    onEdit,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const pointRef = useRef<Vector2d>({ x, y });
    const timerRef = useRef<NodeJS.Timer>();

    const imageUrl = useMemo(() => {
        return `${process.env.PUBLIC_URL}${Pins[pin]}`;
    }, [pin]);

    const [image] = useImage(imageUrl);

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

    const handleClick = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                // イベントの伝播を止める
                event.cancelBubble = true;
            }
        },
        [tool]
    );

    const handleDoubleClick = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                const point = event.target.getStage()?.getPointerPosition();
                if (point) {
                    const { x, y } = point;
                    // ポップアップを開く
                    onEdit({ top: y, left: x });
                }
            }
        },
        [onEdit, tool]
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
        <>
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
                onClick={handleClick}
                onTap={handleClick}
                onDblClick={handleDoubleClick}
                onDblTap={handleDoubleClick}
                _useStrictMode
            />
            {!isDragging && pin !== 'free' && (
                <Image
                    x={x}
                    y={y}
                    offsetX={12}
                    offsetY={-4}
                    rotation={pin === 'pinZ' ? -90 : 0}
                    image={image}
                    width={24}
                    height={24}
                    listening={false}
                />
            )}
        </>
    );
};

const ConnectedNode: React.VFC<NodeProps> = (props) => {
    const { tool, snapSize, setStructure } = useContext(StructureContext);
    const { open } = useContext(PopupContext);

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

    const handleEdit = useCallback(
        (position: PopupPosition) => {
            // ポップアップを表示
            open('nodes', position, props as unknown as PopupParams);
        },
        [open, props]
    );

    return (
        <Node
            {...props}
            draggable={draggable}
            tool={tool}
            onChange={handleChange}
            onCommit={handleCommit}
            onEdit={handleEdit}
        />
    );
};

export default ConnectedNode;
