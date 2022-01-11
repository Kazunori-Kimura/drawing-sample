import { useContext, useMemo } from 'react';
import { Layer } from 'react-konva';
import { Node as NodeProps, Structure } from '../../../types/shape';
import { StructureContext } from '../provider/StructureProvider';
import { Beam, Force, Node, Trapezoid } from '../shape';
import { BeamProps, ForceProps, TrapezoidProps } from '../types';

interface Props {
    structure: Structure;
}

export const ShapeLayerCore: React.VFC<Props> = ({ structure }) => {
    const nodes = useMemo(() => {
        const map: Record<string, NodeProps> = {};

        structure.nodes.forEach((node) => {
            map[node.id] = node;
        });

        return map;
    }, [structure.nodes]);

    const beams = useMemo(() => {
        const map: Record<string, BeamProps> = {};

        structure.beams.forEach(({ nodeI, nodeJ, ...beam }) => {
            const item: BeamProps = {
                ...beam,
                nodeI: nodes[nodeI],
                nodeJ: nodes[nodeJ],
            };
            map[beam.id] = item;
        });

        return map;
    }, [nodes, structure.beams]);

    const forces = useMemo(() => {
        const { forces: items } = structure;
        const map: Record<string, ForceProps> = {};

        if (items.length > 0) {
            const total = items.map((item) => item.force).reduce((p, c) => p + c);
            const average = total / items.length;
            items.forEach(({ beam, force: value, ...force }) => {
                const forceRatio = value / average;
                map[force.id] = {
                    ...force,
                    force: value,
                    forceRatio,
                    beam: beams[beam],
                };
            });
        }

        return map;
    }, [beams, structure]);

    const trapezoids = useMemo(() => {
        const { trapezoids: items } = structure;
        const map: Record<string, TrapezoidProps> = {};

        items.forEach(({ beam, ...props }) => {
            map[props.id] = {
                ...props,
                beam: beams[beam],
            };
        });

        return map;
    }, [beams, structure]);

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

const ShapeLayer: React.VFC = () => {
    const { structure } = useContext(StructureContext);
    return <ShapeLayerCore structure={structure} />;
};

export default ShapeLayer;
