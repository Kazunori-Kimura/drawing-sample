import { KonvaEventObject } from 'konva/lib/Node';
import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';
import { Layer, Rect } from 'react-konva';
import { PageProps, PageSize } from '../../../types/note';
import CanvasHandle from '../nodes/CanvasHandle';

interface Props extends Pick<PageProps, 'size' | 'structures'> {
    draggable?: boolean;
    onChange: Dispatch<SetStateAction<PageProps>>;
}

const Frame: React.VFC<Props> = ({ size, structures, draggable = false, onChange }) => {
    const [selectedIndex, setSelectedIndex] = useState<number>();

    const pageSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

    const handleClick = useCallback((event: KonvaEventObject<Event>) => {
        if (event.target.attrs.type === 'background') {
            setSelectedIndex(undefined);
        }
    }, []);

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
                    selected={index === selectedIndex}
                    onSelect={() => setSelectedIndex(index)}
                    {...structure}
                />
            ))}
        </Layer>
    );
};

export default Frame;
