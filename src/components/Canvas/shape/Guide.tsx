import { useEffect, useRef, useState } from 'react';
import { Arrow, Group, Line, Text } from 'react-konva';
import { Vector } from '../util';

interface Props {
    start: [number, number];
    end: [number, number];
    visible?: boolean;
}

interface GuideProps {
    fill: string;
    stroke: string;
    strokeWidth: number;
    listening: boolean;
}

interface GuideArrowProps extends GuideProps {
    pointerLength: number;
    pointerWidth: number;
    pointerAtBeginning: boolean;
}

const defaultGuideProps: GuideProps = {
    fill: 'silver',
    stroke: 'silver',
    strokeWidth: 1,
    listening: false,
};

const defaultGuideArrowProps: GuideArrowProps = {
    pointerLength: 6,
    pointerWidth: 6,
    pointerAtBeginning: true,
    ...defaultGuideProps,
};

const GuideLine: React.VFC<Props> = ({ start, end }) => {
    const v1Ref = useRef<Vector>(new Vector(0, 0));
    const v2Ref = useRef<Vector>(new Vector(0, 0));

    const [distance, setDistance] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [basis, setBasis] = useState<[number, number]>([0, 0]);

    useEffect(() => {
        v1Ref.current.x = start[0];
        v1Ref.current.y = start[1];
        v2Ref.current.x = end[0];
        v2Ref.current.y = end[1];

        const dist = v1Ref.current.distance(v2Ref.current);
        const dir = v2Ref.current.clone().subtract(v1Ref.current).normalize();
        const angle = dir.angleDeg();

        setDistance(dist);
        setRotation(angle === 90 ? -90 : angle);
        setBasis(angle === 90 ? end : start);
    }, [end, start]);

    return (
        <Group x={basis[0]} y={basis[1]} rotation={rotation}>
            {/* 左端 */}
            <Line points={[0, 0, 0, 10]} {...defaultGuideProps} />
            {/* 矢印部分 */}
            <Arrow points={[0, 5, distance, 5]} {...defaultGuideArrowProps} />
            {/* 右端 */}
            <Line points={[distance, 0, distance, 10]} {...defaultGuideProps} />
            {/* ラベル */}
            <Text
                x={0}
                y={-8}
                text={`${distance}px`}
                fontSize={12}
                fill="silver"
                width={distance}
                align="center"
                listening={false}
                wrap="none"
                ellipsis
            />
        </Group>
    );
};

export default GuideLine;
