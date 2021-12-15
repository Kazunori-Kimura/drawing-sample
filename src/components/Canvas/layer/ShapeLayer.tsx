import { useContext } from 'react';
import { Layer } from 'react-konva';
import { StructureContext } from '../provider/StructureProvider';
import Beam from '../shape/Beam';
import Node from '../shape/Node';

const ShapeLayer: React.VFC = () => {
    const { nodes, beams } = useContext(StructureContext);

    return (
        <Layer>
            {Object.entries(nodes).map(([key, node]) => (
                <Node key={key} {...node} />
            ))}
            {Object.entries(beams).map(([key, beam]) => (
                <Beam key={key} {...beam} />
            ))}
        </Layer>
    );
};

export default ShapeLayer;
