import { useContext, useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { StructureContext } from '../provider/StructureProvider';

const GridInterval = 25;

interface LineProps {
    id: string;
    points: number[];
    stroke: string;
    strokeWidth: number;
    dash: [number, number];
    listening: boolean;
}

const defaultLineProps: LineProps = {
    id: '',
    points: [],
    stroke: '#c9e1ff',
    strokeWidth: 1,
    dash: [5, 3],
    listening: false,
};

const GridLayer: React.VFC = () => {
    const { size } = useContext(StructureContext);

    const horizontalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let y = 0; y <= size.height; y += GridInterval) {
            lines.push({
                ...defaultLineProps,
                id: `Horizontal_${count}`,
                points: [0, y, size.width, y],
            });
            count++;
        }
        return lines;
    }, [size.height, size.width]);

    const verticalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let x = 0; x <= size.width; x += GridInterval) {
            lines.push({
                ...defaultLineProps,
                id: `Vertical_${count}`,
                points: [x, 0, x, size.height],
            });
            count++;
        }
        return lines;
    }, [size.height, size.width]);

    return (
        <Layer listening={false}>
            {/* horizontal */}
            {horizontalLines.map((props) => (
                <Line key={props.id} {...props} />
            ))}
            {/* vertical */}
            {verticalLines.map((props) => (
                <Line key={props.id} {...props} />
            ))}
        </Layer>
    );
};

export default GridLayer;
