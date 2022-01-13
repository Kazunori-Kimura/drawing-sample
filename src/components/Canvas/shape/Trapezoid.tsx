import { KonvaEventObject } from 'konva/lib/Node';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Arrow, Group, Line, Text } from 'react-konva';
import { Point, TrapezoidProps } from '../types';
import { getInsidePoints, intercectPoint, Vector, vX } from '../util';
import Guide from './Guide';

interface Props extends TrapezoidProps {
    visible?: boolean;
    selected?: boolean;
    onClick: (event: KonvaEventObject<Event>) => void;
    onDblClick: (event: KonvaEventObject<Event>) => void;
}

type LinePoints = [number, number, number, number];

interface LineProps {
    stroke: string;
    strokeWidth: number;
}

interface ArrowProps extends LineProps {
    pointerLength: number;
    pointerWidth: number;
    fill: string;
}

const defaultLineProps: LineProps = {
    stroke: 'pink',
    strokeWidth: 2,
};

const defaultArrowProps: ArrowProps = {
    pointerLength: 6,
    pointerWidth: 6,
    fill: 'pink',
    ...defaultLineProps,
};

interface LabelProps {
    offsetX: number;
    offsetY: number;
    fontSize: number;
    wrap: string;
    ellipsis: boolean;
}
const defaultLabelProps: LabelProps = {
    offsetX: -6,
    offsetY: 14,
    fontSize: 12,
    wrap: 'none',
    ellipsis: true,
};

interface LabelAttrs {
    x: number;
    y: number;
    text: string;
    width: number;
    rotation: number;
}

const Trapezoid: React.VFC<Props> = ({
    points: beamPoints,
    id,
    beam,
    forceI,
    forceJ,
    distanceI,
    distanceJ,
    angle = 90,
    isGlobal = false,
    visible = false,
    selected = false,
    onClick,
    onDblClick,
}) => {
    // 分布荷重の矢印
    const [arrows, setArrows] = useState<LinePoints[]>([]);
    // 分布荷重の上端
    const [line, setLine] = useState<LinePoints>([0, 0, 0, 0]);
    // ラベル
    const [labelI, setLabelI] = useState<LabelAttrs>();
    const [labelJ, setLabelJ] = useState<LabelAttrs>();
    // 寸法線
    const [guidePoints, setGuidePoints] = useState<[Point, Point]>([
        [0, 0],
        [0, 0],
    ]);

    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    useEffect(() => {
        const vI = viRef.current;
        const vJ = vjRef.current;

        // 梁要素
        const [ix, iy, jx, jy] = beamPoints;
        vI.x = ix;
        vI.y = iy;
        vJ.x = jx;
        vJ.y = jy;

        // 梁要素の方向
        const vd = vJ.clone().subtract(vI).normalize();
        // 分布荷重の方向
        let dir: Vector;
        if (isGlobal) {
            dir = vX.clone().rotateDeg(angle * -1);
        } else {
            dir = vd
                .clone()
                .rotateDeg(angle * -1)
                .normalize();
        }
        // 梁要素の長さ
        const beamLength = vI.distance(vJ);
        // 分布荷重の下端の位置
        const bi = vI.clone().add(vd.clone().multiplyScalar(beamLength * distanceI));
        const bj = vJ.clone().add(
            vd
                .clone()
                .invert()
                .multiplyScalar(beamLength * distanceJ)
        );
        // 分布荷重の上端の位置
        const pi = bi.clone().add(dir.clone().multiplyScalar(forceI * 10));
        const pj = bj.clone().add(dir.clone().multiplyScalar(forceJ * 10));

        // 下端を等間隔に分割する点を取得
        const points = getInsidePoints(bi, bj, vd);
        // 上端の傾き
        const slope = pj.x - pi.x !== 0 ? (pj.y - pi.y) / (pj.x - pi.x) : NaN;
        // 上端の切片
        const intercept = isNaN(slope) ? NaN : pi.y - slope * pi.x;

        // 内側の矢印
        const insideArrows: LinePoints[] = [];
        points.forEach((pd) => {
            // pd から分布荷重の方向に線を伸ばして上端と交差する点
            const pu = intercectPoint([pi, pj, slope, intercept], pd, dir);
            if (pu) {
                const arrow: LinePoints = [pu[0], pu[1], pd.x, pd.y];
                insideArrows.push(arrow);
            }
        });

        const labelAngle = dir.angleDeg();
        // ラベル (i端)
        setLabelI({
            x: bi.x,
            y: bi.y,
            text: `${forceI}kN/m`,
            width: bi.distance(pi),
            rotation: labelAngle,
        });
        // ラベル (j端)
        setLabelJ({
            x: bj.x,
            y: bj.y,
            text: `${forceJ}kN/m`,
            width: bj.distance(pj),
            rotation: labelAngle,
        });

        // 寸法線の位置
        const force = Math.max(forceI, forceJ) * 10;
        const guidePosition = dir.clone().multiplyScalar(force + 50);
        const gi = bi.clone().add(guidePosition);
        const gj = bj.clone().add(guidePosition);
        setGuidePoints([
            [gi.x, gi.y],
            [gj.x, gj.y],
        ]);

        // 上端
        setLine([pi.x, pi.y, pj.x, pj.y]);
        // 矢印
        setArrows([
            // 左端
            [pi.x, pi.y, bi.x, bi.y],
            // 内側の矢印
            ...insideArrows,
            // 右端
            [pj.x, pj.y, bj.x, bj.y],
        ]);
    }, [angle, beamPoints, distanceI, distanceJ, forceI, forceJ, isGlobal]);

    const color = useMemo(() => {
        return selected ? 'red' : 'pink';
    }, [selected]);

    return (
        <Group
            type="trapezoid"
            id={id}
            beam={beam}
            visible={visible}
            onClick={onClick}
            onTap={onClick}
            onDblClick={onDblClick}
            onDblTap={onDblClick}
        >
            {/* 上端 */}
            <Line points={line} {...defaultLineProps} stroke={color} />
            {/* 矢印 */}
            {arrows.map((arrow, index) => (
                <Arrow
                    key={`arrow_${index}`}
                    points={arrow}
                    {...defaultArrowProps}
                    stroke={color}
                    fill={color}
                />
            ))}
            {/* ラベルと寸法線 */}
            {selected && (
                <>
                    {/* I端側ラベル */}
                    <Text {...defaultLabelProps} {...labelI} fill={color} />
                    {/* J端側ラベル */}
                    <Text {...defaultLabelProps} {...labelJ} fill={color} />
                    {/* 寸法線 */}
                    <Guide start={guidePoints[0]} end={guidePoints[1]} />
                </>
            )}
        </Group>
    );
};

export default Trapezoid;
