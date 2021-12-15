import { useContext } from 'react';
import { Layer } from 'react-konva';
import { StructureContext } from '../provider/StructureProvider';
import { Beam, Force, Node } from '../shape';

const ShapeLayer: React.VFC = () => {
    const { nodes, beams, forces } = useContext(StructureContext);

    return (
        <Layer>
            {Object.entries(nodes).map(([key, node]) => (
                <Node key={key} {...node} />
            ))}
            {Object.entries(beams).map(([key, beam]) => (
                <Beam key={key} {...beam} />
            ))}
            {Object.entries(forces).map(([key, force]) => (
                <Force key={key} {...force} />
            ))}
        </Layer>
    );
};

export default ShapeLayer;
