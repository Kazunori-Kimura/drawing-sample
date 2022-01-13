import { useContext } from 'react';
import { Layer, Line } from 'react-konva';
import { AppSettingsContext } from '../../../providers/AppSettingsProvider';
import { NoteSettingsContext } from '../../../providers/NoteSettingsProvider';
import { StrokeContext } from '../StrokeProvider';

const Draw: React.VFC = () => {
    const { drawings } = useContext(AppSettingsContext);
    const { settings } = useContext(NoteSettingsContext);
    const { points } = useContext(StrokeContext);
    return (
        <Layer>
            {drawings.map(({ eraser = false, ...lineProps }, index) => (
                <Line
                    key={`note-drawing-${index}`}
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                    {...lineProps}
                    globalCompositeOperation={eraser ? 'destination-out' : 'source-over'}
                />
            ))}
            {/* 現在描画中の線 */}
            {points && (
                <Line
                    lineCap="round"
                    lineJoin="round"
                    tension={0.5}
                    points={points}
                    {...settings}
                    globalCompositeOperation={settings.eraser ? 'destination-out' : 'source-over'}
                />
            )}
        </Layer>
    );
};

export default Draw;
