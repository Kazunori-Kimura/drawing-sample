import { useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { DOMSize } from '../../../types/common';

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

const GridSize = 50;

interface Props {
    pageSize: DOMSize;
}

const Grid: React.VFC<Props> = ({ pageSize }) => {
    const horizontalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let y = 0; y <= pageSize.height; y += GridSize) {
            lines.push({
                ...defaultLineProps,
                id: `Horizontal_${count}`,
                points: [0, y, pageSize.width, y],
            });
            count++;
        }
        return lines;
    }, [pageSize]);

    const verticalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let x = 0; x <= pageSize.width; x += GridSize) {
            lines.push({
                ...defaultLineProps,
                id: `Vertical_${count}`,
                points: [x, 0, x, pageSize.height],
            });
            count++;
        }
        return lines;
    }, [pageSize]);

    return (
        <Layer>
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

export default Grid;
