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
    min: number;
    max: number;
    guides: GuideLineProps[];
}

const GlobalGuideX = 30;
const LocalGuideX = 55;

const GuideLayer: React.VFC = () => {
    const { nodes } = useContext(StructureContext);

    const { min, max, guides }: GuidePoint = useMemo(() => {
        const guide: GuidePoint = {
            max: Number.MIN_SAFE_INTEGER,
            min: Number.MAX_SAFE_INTEGER,
            guides: [],
        };

        const points = new Set<number>();
        Object.values(nodes).forEach(({ y }) => {
            if (guide.max < y) {
                guide.max = y;
            }
            if (guide.min > y) {
                guide.min = y;
            }
            if (!points.has(y)) {
                points.add(y);
            }
        });

        // ガイドの生成
        if (points.size > 1) {
            const array = Array.from(points).sort((a, b) => (a < b ? -1 : 1));
            let prev = array[0];
            for (let i = 1; i < array.length; i++) {
                const current = array[i];
                const props: GuideLineProps = {
                    key: `LocalGuide_${i}`,
                    start: [LocalGuideX, prev],
                    end: [LocalGuideX, current],
                };
                prev = current;
                guide.guides.push(props);
            }
        }

        return guide;
    }, [nodes]);

    // min と max がセットされていなければ描画しない
    if (min === Number.MAX_SAFE_INTEGER || max === Number.MIN_SAFE_INTEGER) {
        return null;
    }

    return (
        <Layer listening={false}>
            <GuideLine start={[GlobalGuideX, min]} end={[GlobalGuideX, max]} />
            {guides.map((props) => (
                <GuideLine {...props} />
            ))}
        </Layer>
    );
};

export default GuideLayer;
