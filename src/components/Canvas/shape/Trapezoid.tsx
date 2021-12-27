import { useEffect, useState } from 'react';
import { Arrow, Group, Line } from 'react-konva';
import { Point, TrapezoidProps } from '../types';
import { lerp, Vector, vX } from '../util';

type Props = TrapezoidProps;

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

const InsideArrowCount = 10;
const InsideArrowInterval = 25;
const InsideArrowMinInterval = 10;

/**
 * 開始点から終了点まで等間隔に点を取る
 * @param start
 * @param end
 * @param direction
 * @returns
 */
const getInsidePoints = (start: Vector, end: Vector, direction: Vector): Vector[] => {
    const points: Vector[] = [];
    // 2点間の距離
    const distance = start.distance(end);
    // 分割数
    let count = InsideArrowCount;
    // 間隔
    let interval = distance / (count + 1);
    while (interval < InsideArrowInterval && count > 0) {
        count--;
        interval = distance / (count + 1);
    }

    if (count > 0) {
        // 始点から interval の間隔で count 個 点を取る
        for (let i = 1; i <= count; i++) {
            const point = start.clone().add(direction.clone().multiplyScalar(interval * i));
            points.push(point);
        }
    } else {
        // 半分にしてみる
        interval = distance / 2;
        if (interval >= InsideArrowMinInterval) {
            // 半分の位置に点を置く
            const point = lerp(start, end, 0.5);
            points.push(point);
        }
    }

    return points;
};

/**
 * 開始点からある方向に伸ばした線が対象となる線と交わる点を取得する
 * @param targetLine 対象となる Line [始点、終点、傾き、切片]
 * @param start 開始点
 * @param dir 方向
 * @returns 交点（なければ null）
 */
const intercectPoint = (
    targetLine: [Vector, Vector, number, number],
    start: Vector,
    dir: Vector
): Point | null => {
    const [pi, pj, slope1, intercept1] = targetLine;
    let point: Point | null = null;
    try {
        // dir の傾き
        const end: Vector = start.clone().add(dir);
        const slope2 = end.x - start.x !== 0 ? (end.y - start.y) / (end.x - start.x) : NaN;
        // dir の切片
        const intercept2 = isNaN(slope2) ? NaN : start.y - slope2 * start.x;

        if (slope1 === slope2) {
            // 平行なので交点なし
            return null;
        }

        if (!isNaN(slope1) && !isNaN(slope2)) {
            // どちらも垂直でない
            const px = (intercept2 - intercept1) / (slope1 - slope2);
            const py = slope1 * px + intercept1;

            point = [px, py];
        } else if (isNaN(slope1)) {
            // 対象の Line が垂直
            const px = pi.x;
            const py = px * slope2 + intercept2;

            point = [px, py];
        } else if (isNaN(slope2)) {
            // dir が垂直
            const px = start.x;
            const py = px * slope1 + intercept1;

            point = [px, py];
        }

        // 交点が Line の内側？
        if (point) {
            const [x, y] = point;
            const rangeX = [pi.x, pj.x].sort((a, b) => a - b);
            const rangeY = [pi.y, pj.y].sort((a, b) => a - b);
            if (x >= rangeX[0] && x <= rangeX[1] && y >= rangeY[0] && y <= rangeY[1]) {
                return point;
            }
        }
        return null;
    } catch (err) {
        console.error(err);
    }

    return null;
};

const Trapezoid: React.VFC<Props> = ({
    beam,
    forceI,
    forceJ,
    distanceI,
    distanceJ,
    angle = 90,
    isGlobal = false,
}) => {
    // 分布荷重の矢印
    const [arrows, setArrows] = useState<LinePoints[]>([]);
    // 分布荷重の上端
    const [line, setLine] = useState<LinePoints>([0, 0, 0, 0]);

    useEffect(() => {
        // 梁要素
        const { nodeI, nodeJ } = beam;
        const vI = new Vector(nodeI.x, nodeI.y);
        const vJ = new Vector(nodeJ.x, nodeJ.y);
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
    }, [angle, beam, distanceI, distanceJ, forceI, forceJ, isGlobal]);

    return (
        <Group listening={false}>
            {/* 上端 */}
            <Line points={line} {...defaultLineProps} />
            {/* 矢印 */}
            {arrows.map((arrow, index) => (
                <Arrow key={`arrow_${index}`} points={arrow} {...defaultArrowProps} />
            ))}
        </Group>
    );
};

export default Trapezoid;
