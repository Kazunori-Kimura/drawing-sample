import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { Dispatch, SetStateAction, useCallback, useMemo, useRef } from 'react';
import { Stage } from 'react-konva';
import { DOMSize } from '../../types/common';
import { PageProps, PageSize } from '../../types/note';
import Draw from './layer/Draw';
import Grid from './layer/Grid';

interface Props extends PageProps {
    viewBox: DOMSize;
    onChange: Dispatch<SetStateAction<PageProps>>;
}

const Page: React.VFC<Props> = ({ viewBox, size, drawings }) => {
    const stageRef = useRef<Konva.Stage>(null);

    const pageSize = useMemo(() => {
        return PageSize[size];
    }, [size]);

    /**
     * ページサイズの範囲で表示領域を移動する
     */
    const handleDragMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            const { x, y } = event.target.attrs;
            if (stageRef.current && typeof x === 'number' && typeof y === 'number') {
                let [newX, newY] = [x, y];
                let modified = false;

                if (newX > 0) {
                    newX = 0;
                    modified = true;
                } else if (Math.abs(newX) + viewBox.width > pageSize.width) {
                    newX = viewBox.width - pageSize.width;
                    modified = true;
                }

                if (newY > 0) {
                    newY = 0;
                    modified = true;
                } else if (Math.abs(newY) + viewBox.height > pageSize.height) {
                    newY = viewBox.height - pageSize.height;
                    modified = true;
                }

                if (modified) {
                    stageRef.current.setPosition({ x: newX, y: newY });
                }
            }
        },
        [pageSize.height, pageSize.width, viewBox.height, viewBox.width]
    );

    return (
        <Stage
            ref={stageRef}
            width={viewBox.width}
            height={viewBox.height}
            draggable
            onDragMove={handleDragMove}
        >
            <Grid size={size} />
            <Draw drawings={drawings} />
        </Stage>
    );
};

export default Page;
