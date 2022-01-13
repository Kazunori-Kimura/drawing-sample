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
                    lineCap="round"
                    lineJoin="round"
                    {...lineProps}
                    globalCompositeOperation={eraser ? 'destination-out' : 'source-over'}
                />
            ))}
            {/* 現在描画中の線 */}
            {points && (
                <Line
                    lineCap="round"
                    lineJoin="round"
                    points={points}
                    {...settings}
                    globalCompositeOperation={settings.eraser ? 'destination-out' : 'source-over'}
                />
            )}
        </Layer>
    );
};

export default Draw;
