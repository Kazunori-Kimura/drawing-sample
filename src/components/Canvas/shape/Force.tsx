import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Arrow, Group, Text } from 'react-konva';
import { ForceProps, Point } from '../types';
import { lerp, Vector, verticalNormalizeVector, vX } from '../util';

interface Props extends ForceProps {
    ratio: number;
    visible?: boolean;
    selected?: boolean;
    onClick: (event: KonvaEventObject<Event>) => void;
    onDblClick: (event: KonvaEventObject<Event>) => void;
}

const BaseLength = 30;

const Force: React.VFC<Props> = ({
    points: beamPoints,
    id,
    distanceI,
    force,
    ratio,
    visible = false,
    selected = false,
    onClick,
    onDblClick,
}) => {
    const [points, setPoints] = useState<number[]>([]);
    const [distance, setDistance] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [labelPosition, setLabelPosition] = useState<Point>([0, 0]);

    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    useEffect(() => {
        const [nodeIx, nodeIy, nodeJx, nodeJy] = beamPoints;

        // i端、j端
        viRef.current.x = nodeIx;
        viRef.current.y = nodeIy;
        vjRef.current.x = nodeJx;
        vjRef.current.y = nodeJy;

        // 矢印の先端
        const tail = lerp(viRef.current, vjRef.current, distanceI);
        // 梁に直交する単位ベクトル
        const vertical = verticalNormalizeVector(viRef.current, vjRef.current);
        // 矢印の開始点
        const arrowLength = isNaN(ratio) ? BaseLength : BaseLength * ratio;
        const head = tail.clone().add(vertical.multiplyScalar(arrowLength));

        setPoints([head.x, head.y, tail.x, tail.y]);

        // ラベル描画用
        setDistance(Math.max(arrowLength, 140));
        const angle = vertical.clone().angleDeg();
        setRotation(angle);
        const dir = viRef.current.clone().subtract(vjRef.current).normalize();
        if (vX.dot(dir) < 0) {
            dir.invert();
        }
        const p = tail.clone().add(dir.multiplyScalar(6));
        setLabelPosition([p.x, p.y]);
    }, [beamPoints, distanceI, ratio]);

    const color = useMemo(() => {
        return selected ? 'red' : 'orange';
    }, [selected]);

    return (
        <Group
            type="force"
            id={id}
            visible={visible}
            onClick={onClick}
            onTap={onClick}
            onDblClick={onDblClick}
            onDblTap={onDblClick}
        >
            <Arrow
                points={points}
                pointerLength={6}
                pointerWidth={6}
                fill={color}
                stroke={color}
                strokeWidth={2}
            />
            {selected && (
                <Text
                    x={labelPosition[0]}
                    y={labelPosition[1]}
                    offsetX={-6}
                    text={`${force}kN`}
                    fontSize={12}
                    width={distance}
                    rotation={rotation}
                    fill={color}
                    wrap="none"
                    ellipsis
                />
            )}
        </Group>
    );
};

export default Force;
