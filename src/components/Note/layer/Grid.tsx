import { useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { PageSize, PageSizeType } from '../../../types/note';

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
    size: PageSizeType;
}

const Grid: React.VFC<Props> = ({ size }) => {
    const layerSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

    const horizontalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let y = 0; y <= layerSize.height; y += GridSize) {
            lines.push({
                ...defaultLineProps,
                id: `Horizontal_${count}`,
                points: [0, y, layerSize.width, y],
            });
            count++;
        }
        return lines;
    }, [layerSize]);

    const verticalLines: LineProps[] = useMemo(() => {
        const lines: LineProps[] = [];
        let count = 1;
        for (let x = 0; x <= layerSize.width; x += GridSize) {
            lines.push({
                ...defaultLineProps,
                id: `Vertical_${count}`,
                points: [x, 0, x, layerSize.height],
            });
            count++;
        }
        return lines;
    }, [layerSize]);

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
