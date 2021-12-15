import { Layer, Line } from 'react-konva';

interface Props {
    points: number[];
}

const DrawLayer: React.VFC<Props> = ({ points }) => {
    return (
        <Layer>
            <Line points={points} strokeWidth={3} stroke="blue" />
        </Layer>
    );
};

export default DrawLayer;
