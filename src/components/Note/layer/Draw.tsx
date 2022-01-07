import { Layer, Line } from 'react-konva';
import { DrawingProps, DrawSettings } from '../../../types/note';

interface Props {
    drawings: DrawingProps[];
    // 描画中のデータ
    settings: DrawSettings;
    points?: number[];
}

const Draw: React.VFC<Props> = ({ drawings, settings, points }) => {
    return (
        <Layer>
            {drawings.map(({ eraser = false, ...lineProps }, index) => (
                <Line
                    key={`note-drawing-${index}`}
                    {...lineProps}
                    globalCompositeOperation={eraser ? 'destination-out' : 'source-over'}
                />
            ))}
            {points && (
                <Line
                    {...settings}
                    points={points}
                    globalCompositeOperation={settings.eraser ? 'destination-out' : 'source-over'}
                />
            )}
        </Layer>
    );
};

export default Draw;
