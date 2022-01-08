import { useContext } from 'react';
import { Layer } from 'react-konva';
import { StructureContext } from '../provider/StructureProvider';
import { Beam, Force, Node, Trapezoid } from '../shape';

const ShapeLayer: React.VFC = () => {
    const { nodes, beams, forces, trapezoids } = useContext(StructureContext);

    return (
        <Layer>
            {Object.entries(beams).map(([key, beam]) => (
                <Beam key={key} {...beam} />
            ))}
            {Object.entries(nodes).map(([key, node]) => (
                <Node key={key} {...node} />
            ))}
            {Object.entries(forces).map(([key, force]) => (
                <Force key={key} {...force} />
            ))}
            {Object.entries(trapezoids).map(([key, trapezoid]) => (
                <Trapezoid key={key} {...trapezoid} />
            ))}
        </Layer>
    );
};

export default ShapeLayer;
