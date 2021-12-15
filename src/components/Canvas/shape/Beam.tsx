import { useMemo } from 'react';
import { Line } from 'react-konva';
import { BeamProps } from '../types';

type Props = BeamProps;

const Beam: React.VFC<Props> = ({ nodeI, nodeJ }) => {
    const points = useMemo(() => {
        return [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y];
    }, [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y]);

    return <Line points={points} stroke="black" strokeWidth={3} />;
};

export default Beam;
