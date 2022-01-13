import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { Line, Text } from 'react-konva';
import { Guide } from '.';
import { BeamProps, Point } from '../types';
import { Vector, verticalNormalizeVector } from '../util';

interface Props extends BeamProps {
    selected?: boolean;
    onClick: (event: KonvaEventObject<Event>) => void;
}

const Beam: React.ForwardRefRenderFunction<Konva.Line, Props> = (
    { id, name, nodeI, nodeJ, points, selected = false, onClick },
    ref
) => {
    const [labelPosition, setLabelPosition] = useState<Point>([0, 0]);
    const [labelWidth, setLabelWidth] = useState(0);
    const [labelAngle, setLabelAngle] = useState(0);
    const [guidePoints, setGuidePoints] = useState<[Point, Point]>([
        [0, 0],
        [0, 0],
    ]);
    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    useEffect(() => {
        if (selected) {
            const [nodeI_x, nodeI_y, nodeJ_x, nodeJ_y] = points;
            viRef.current.x = nodeI_x;
            viRef.current.y = nodeI_y;
            vjRef.current.x = nodeJ_x;
            vjRef.current.y = nodeJ_y;

            // 必ず左から右になるようにする
            let vi = viRef.current;
            let vj = vjRef.current;
            if (vi.x > vj.x) {
                [vi, vj] = [vj, vi];
            }

            // 梁要素の長さ
            const distance = vi.distance(vj);
            // 梁要素に対して垂直なベクトル
            const dir = verticalNormalizeVector(vi, vj);
            // ラベル位置
            const label = vi.clone().add(dir.clone().multiplyScalar(16));
            // ラベル方向
            const angle = vj.clone().subtract(vi).angleDeg();
            // 寸法線位置
            const guideDir = dir.clone().multiplyScalar(75);
            const guideI = vi.clone().add(guideDir);
            const guideJ = vj.clone().add(guideDir);

            setLabelWidth(distance);
            setLabelPosition([label.x, label.y]);
            setLabelAngle(angle);
            setGuidePoints([
                [guideI.x, guideI.y],
                [guideJ.x, guideJ.y],
            ]);
        }
    }, [points, selected]);

    return (
        <>
            <Line
                ref={ref}
                type="beam"
                id={id}
                name={name}
                nodeI={nodeI}
                nodeJ={nodeJ}
                points={points}
                stroke={selected ? 'blue' : 'black'}
                strokeWidth={4}
                onClick={onClick}
                onTap={onClick}
            />
            {selected && (
                <>
                    {/* ラベル */}
                    <Text
                        x={labelPosition[0]}
                        y={labelPosition[1]}
                        rotation={labelAngle}
                        text={name}
                        fontSize={12}
                        width={labelWidth}
                        fill="blue"
                        align="center"
                        wrap="none"
                        ellipsis
                        listening={false}
                    />
                    {/* 寸法線 */}
                    <Guide start={guidePoints[0]} end={guidePoints[1]} />
                </>
            )}
        </>
    );
};

export default forwardRef(Beam);
