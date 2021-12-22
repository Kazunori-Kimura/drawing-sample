import { useContext } from 'react';
import { Layer } from 'react-konva';
import Popup from '../popup';
import { StructureContext } from '../provider/StructureProvider';
import { Beam, Force, Node } from '../shape';

const ShapeLayer: React.VFC = () => {
    const { nodes, beams, forces } = useContext(StructureContext);

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
            {/* ポップアップ */}
            <Popup />
        </Layer>
    );
};

export default ShapeLayer;
