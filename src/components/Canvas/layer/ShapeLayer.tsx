import { useCallback, useContext } from 'react';
import { Layer } from 'react-konva';
import { Node as NodeProps } from '../../../types/shape';
import { StructureContext } from '../provider/StructureProvider';
import { Beam, Force, Node } from '../shape';
import { clone } from '../util';

const ShapeLayer: React.VFC = () => {
    const { tool, nodes, beams, forces, setStructure } = useContext(StructureContext);

    const handleChangeNode = useCallback(
        ({ id, x, y }: NodeProps) => {
            if (setStructure) {
                setStructure((structure) => {
                    const data = clone(structure);
                    const node = data.nodes.find((item) => item.id === id);
                    if (node) {
                        node.x = x;
                        node.y = y;
                    }
                    return data;
                });
            }
        },
        [setStructure]
    );

    return (
        <Layer>
            {Object.entries(beams).map(([key, beam]) => (
                <Beam key={key} {...beam} />
            ))}
            {Object.entries(nodes).map(([key, node]) => (
                <Node
                    key={key}
                    {...node}
                    draggable={tool !== 'pen' && Boolean(setStructure)}
                    onChange={handleChangeNode}
                />
            ))}
            {Object.entries(forces).map(([key, force]) => (
                <Force key={key} {...force} />
            ))}
        </Layer>
    );
};

export default ShapeLayer;
