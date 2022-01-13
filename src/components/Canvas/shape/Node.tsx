import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { forwardRef, useCallback, useMemo } from 'react';
import { Circle, Image } from 'react-konva';
import useImage from 'use-image';
import { Node as NodeProps, NodePinType } from '../../../types/shape';

interface Props extends NodeProps {
    draggable?: boolean;
    isDragging?: boolean;
    onDblClick: (event: KonvaEventObject<Event>) => void;
    onDragStart: (event: KonvaEventObject<Event>) => void;
    onDragMove: (event: KonvaEventObject<Event>) => void;
    onDragEnd: (event: KonvaEventObject<Event>) => void;
}

const Pins: Record<NodePinType, string> = {
    free: '/assets/images/pins/pin_1.svg', // とりあえずダミーで指定
    pin: '/assets/images/pins/pin_1.svg',
    pinX: '/assets/images/pins/pin_2.svg',
    pinZ: '/assets/images/pins/pin_2.svg',
    fixX: '/assets/images/pins/pin_3.svg',
    fix: '/assets/images/pins/pin_4.svg',
};

const Node: React.ForwardRefRenderFunction<Konva.Circle, Props> = (
    {
        id,
        x,
        y,
        pin,
        draggable = false,
        isDragging = false,
        onDblClick,
        onDragStart,
        onDragMove,
        onDragEnd,
    },
    ref
) => {
    const imageUrl = useMemo(() => {
        return `${process.env.PUBLIC_URL}${Pins[pin ?? 'free']}`;
    }, [pin]);
    const [image] = useImage(imageUrl);

    const handleClick = useCallback((event: KonvaEventObject<Event>) => {
        // ダブルクリック時にはクリックイベントも発生する
        // 何もバインドしていないと Stage のクリックイベント（選択解除）が発生するので
        // イベントの伝播を止めるだけのイベントハンドラを設定する
        event.cancelBubble = true;
    }, []);

    return (
        <>
            <Circle
                ref={ref}
                type="node"
                id={id}
                x={x}
                y={y}
                pin={pin}
                fill={isDragging ? 'blue' : 'black'}
                radius={4}
                draggable={draggable}
                onDragStart={onDragStart}
                onDragMove={onDragMove}
                onDragEnd={onDragEnd}
                onClick={handleClick}
                onTap={handleClick}
                onDblClick={onDblClick}
                onDblTap={onDblClick}
                _useStrictMode
            />
            {!isDragging && pin && pin !== 'free' && (
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

export default forwardRef(Node);
