import { KonvaEventObject } from 'konva/lib/Node';
import { Dispatch, SetStateAction, useCallback, useContext, useMemo } from 'react';
import { Layer, Rect } from 'react-konva';
import { AppSettingsContext } from '../../../providers/AppSettingsProvider';
import { PageProps, PageSize } from '../../../types/note';
import CanvasHandle from '../nodes/CanvasHandle';

interface Props extends Pick<PageProps, 'size' | 'structures'> {
    draggable?: boolean;
    onChange: Dispatch<SetStateAction<PageProps>>;
}

const Frame: React.VFC<Props> = ({ size, structures, draggable = false, onChange }) => {
    const { selectedCanvasIndex, onSelectCanvas } = useContext(AppSettingsContext);

    const pageSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

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
                    size={size}
                    draggable={draggable}
                    index={index}
                    onChange={onChange}
                    selected={index === selectedCanvasIndex}
                    onSelect={() => onSelectCanvas(index)}
                    {...structure}
                />
            ))}
        </Layer>
    );
};

export default Frame;
