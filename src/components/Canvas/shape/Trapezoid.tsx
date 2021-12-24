import { useEffect, useState } from 'react';
import { Arrow, Group, Line } from 'react-konva';
import { TrapezoidProps } from '../types';
import { Vector, vX } from '../util';

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

        // 上端
        setLine([pi.x, pi.y, pj.x, pj.y]);
        // 矢印
        setArrows([
            // 左端
            [pi.x, pi.y, bi.x, bi.y],
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
