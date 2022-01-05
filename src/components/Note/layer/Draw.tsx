import { Layer, Line } from 'react-konva';
import { DrawingProps } from '../../../types/note';

interface Props {
    drawings: DrawingProps[];
}

const Draw: React.VFC<Props> = ({ drawings }) => {
    return (
        <Layer>
            {drawings.map(({ eraser = false, ...lineProps }, index) => (
                <Line
                    key={`note-drawing-${index}`}
                    {...lineProps}
                    globalCompositeOperation={eraser ? 'destination-out' : 'source-over'}
                />
            ))}
        </Layer>
    );
};

export default Draw;
