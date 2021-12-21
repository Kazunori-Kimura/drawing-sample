import { useContext, useMemo } from 'react';
import { Layer } from 'react-konva';
import { StructureContext } from '../provider/StructureProvider';
import GuideLine from '../shape/Guide';

interface GuideLineProps {
    key: string;
    start: [number, number];
    end: [number, number];
}

interface GuidePoint {
    minX: number;
    maxX: number;
    guidesX: GuideLineProps[];
    minY: number;
    maxY: number;
    guidesY: GuideLineProps[];
}

const GuideInterval = 25;

const GuideLayer: React.VFC = () => {
    const { nodes } = useContext(StructureContext);

    const { minX, maxX, guidesX, minY, maxY, guidesY }: GuidePoint = useMemo(() => {
        const guide: GuidePoint = {
            maxX: Number.MIN_SAFE_INTEGER,
            minX: Number.MAX_SAFE_INTEGER,
            guidesX: [],
            maxY: Number.MIN_SAFE_INTEGER,
            minY: Number.MAX_SAFE_INTEGER,
            guidesY: [],
        };

        const pointsX = new Set<number>();
        const pointsY = new Set<number>();
        Object.values(nodes).forEach(({ x, y }) => {
            if (guide.maxX < x) {
                guide.maxX = x;
            }
            if (guide.minX > x) {
                guide.minX = x;
            }
            if (!pointsX.has(x)) {
                pointsX.add(x);
            }
            if (guide.maxY < y) {
                guide.maxY = y;
            }
            if (guide.minY > y) {
                guide.minY = y;
            }
            if (!pointsY.has(y)) {
                pointsY.add(y);
            }
        });

        // ガイドの生成
        if (pointsX.size > 1) {
            const array = Array.from(pointsX).sort((a, b) => (a < b ? -1 : 1));
            let prev = array[0];
            for (let i = 1; i < array.length; i++) {
                const current = array[i];
                const props: GuideLineProps = {
                    key: `LocalGuideX_${i}`,
                    start: [prev, guide.maxY + GuideInterval * 4],
                    end: [current, guide.maxY + GuideInterval * 4],
                };
                prev = current;
                guide.guidesX.push(props);
            }
        }
        if (pointsY.size > 1) {
            const array = Array.from(pointsY).sort((a, b) => (a < b ? -1 : 1));
            let prev = array[0];
            const localX = Math.max(guide.minX - GuideInterval * 4, GuideInterval * 2);
            for (let i = 1; i < array.length; i++) {
                const current = array[i];
                const props: GuideLineProps = {
                    key: `LocalGuideY_${i}`,
                    start: [localX, prev],
                    end: [localX, current],
                };
                prev = current;
                guide.guidesY.push(props);
            }
        }

        return guide;
    }, [nodes]);

    const GlobalVerticalGuidePositionX = useMemo(() => {
        if (minX !== Number.MAX_SAFE_INTEGER) {
            return Math.max(GuideInterval, minX - GuideInterval * 5);
        }
        return 0;
    }, [minX]);

    const GlobalHorizontalGuidePositionY = useMemo(() => {
        if (maxY !== Number.MIN_SAFE_INTEGER) {
            return maxY + GuideInterval * 5;
        }
        return 0;
    }, [maxY]);

    return (
        <Layer listening={false}>
            {/* Horizontal */}
            {minX !== Number.MAX_SAFE_INTEGER && maxX !== Number.MIN_SAFE_INTEGER && (
                <GuideLine
                    start={[minX, GlobalHorizontalGuidePositionY]}
                    end={[maxX, GlobalHorizontalGuidePositionY]}
                />
            )}
            {guidesX.map((props) => (
                <GuideLine {...props} />
            ))}
            {/* Vertical */}
            {minY !== Number.MAX_SAFE_INTEGER && maxY !== Number.MIN_SAFE_INTEGER && (
                <GuideLine
                    start={[GlobalVerticalGuidePositionX, minY]}
                    end={[GlobalVerticalGuidePositionX, maxY]}
                />
            )}
            {guidesY.map((props) => (
                <GuideLine {...props} />
            ))}
        </Layer>
    );
};

export default GuideLayer;
