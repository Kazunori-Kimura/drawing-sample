import { Circle } from 'react-konva';
import { Node as NodeProps } from '../../../types/shape';

type Props = NodeProps;

const Node: React.VFC<Props> = ({ x, y }) => {
    return <Circle x={x} y={y} fill="black" radius={4} />;
};

export default Node;
