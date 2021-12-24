import { useContext, useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { CanvasTool } from '../../../types/common';
import { DrawContext } from '../provider/DrawProvider';

interface Props {
    tool: CanvasTool;
    points: number[];
}

const DrawLayer: React.VFC<Props> = ({ tool, points }) => {
    const color = useMemo(() => {
        switch (tool) {
            case 'pen':
                return 'blue';
            case 'trapezoid':
                return 'red';
            default:
                return 'black';
        }
    }, [tool]);

    return (
        <Layer>
            <Line points={points} strokeWidth={3} stroke={color} />
        </Layer>
    );
};

const ConnectedDrawLayer: React.VFC = () => {
    const { tool, points } = useContext(DrawContext);
    return <DrawLayer tool={tool} points={points} />;
};

export default ConnectedDrawLayer;
