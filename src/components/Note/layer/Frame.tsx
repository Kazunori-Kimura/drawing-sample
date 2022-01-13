import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext } from 'react';
import { Layer, Rect } from 'react-konva';
import { AppSettingsContext } from '../../../providers/AppSettingsProvider';
import { NoteSettingsContext } from '../../../providers/NoteSettingsProvider';
import CanvasHandle from '../nodes/CanvasHandle';

interface Props {
    draggable?: boolean;
}

const Frame: React.VFC<Props> = ({ draggable = false }) => {
    const { mode: noteMode } = useContext(NoteSettingsContext);
    const {
        mode: appMode,
        pageSize,
        structures,
        onChangeStructures,
        selectedCanvasIndex,
        onSelectCanvas,
        editCanvas,
        closeCanvas,
    } = useContext(AppSettingsContext);

    /**
     * canvas 以外がクリックされた場合に選択解除する
     */
    const handleClick = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (event.target.attrs.type === 'background') {
                onSelectCanvas(undefined);
            }
        },
        [onSelectCanvas]
    );

    return (
        <Layer>
            {/* クリックが空振りしたときに選択解除する */}
            <Rect
                x={0}
                y={0}
                {...pageSize}
                attrs={{ type: 'background' }}
                onClick={handleClick}
                onTap={handleClick}
            />
            {structures.map((structure, index) => (
                <CanvasHandle
                    key={`handle-${index}`}
                    appMode={appMode}
                    noteMode={noteMode}
                    pageSize={pageSize}
                    draggable={draggable}
                    index={index}
                    onChange={onChangeStructures}
                    selected={index === selectedCanvasIndex}
                    onSelect={() => onSelectCanvas(index)}
                    onEditCanvas={editCanvas}
                    onCloseCanvas={closeCanvas}
                    {...structure}
                />
            ))}
        </Layer>
    );
};

export default Frame;
