import { useContext, useMemo } from 'react';
import { Layer, Line } from 'react-konva';
import { CanvasContext } from '../provider/CanvasProvider';
import { DrawContext } from '../provider/DrawProvider';

const DrawLayer: React.VFC = () => {
    const { tool } = useContext(CanvasContext);
    const { points } = useContext(DrawContext);

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

export default DrawLayer;
