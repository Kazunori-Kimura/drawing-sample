import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback } from 'react';
import { Layer, Rect, Text } from 'react-konva';

interface Props {
    x: number;
    y: number;
    width: number;
    height: number;
    visible?: boolean;
}

const CanvasContainer: React.VFC<Props> = ({ visible = false, ...props }) => {
    const handleClick = useCallback((event: KonvaEventObject<Event>) => {
        console.log('hoge');
        const position = event.target.getStage()?.getPointerPosition();
        if (position) {
            console.log(position);
        }
    }, []);

    return (
        <Layer x={props.x} y={props.y} visible={visible}>
            <Rect
                x={0}
                y={0}
                width={props.width}
                height={props.height}
                fill="#ccc"
                onClick={handleClick}
            />
            <Text x={0} y={0} text={`${JSON.stringify(props)}`} fill="black" />
        </Layer>
    );
};

export default CanvasContainer;
