import { useContext, useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { StructureContext } from '../provider/StructureProvider';

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
    // キャンバスサイズ, グリッドの幅
    const { size, gridSize } = useContext(StructureContext);

    const horizontalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let y = 0; y <= size.height; y += gridSize) {
            lines.push({
                ...defaultLineProps,
                id: `Horizontal_${count}`,
                points: [0, y, size.width, y],
            });
            count++;
        }
        return lines;
    }, [gridSize, size.height, size.width]);

    const verticalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let x = 0; x <= size.width; x += gridSize) {
            lines.push({
                ...defaultLineProps,
                id: `Vertical_${count}`,
                points: [x, 0, x, size.height],
            });
            count++;
        }
        return lines;
    }, [gridSize, size.height, size.width]);

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
