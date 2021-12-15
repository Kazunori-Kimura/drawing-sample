import { createContext, useCallback, useMemo } from 'react';
import { Node, Structure } from '../../../types/shape';
import { BeamProps, ForceProps } from '../types';

interface Props {
    children: React.ReactNode;
    structure: Structure;
    onChange?: (structure: Structure) => void;
}

interface IStructureContext {
    // 単位変換された構造データ
    structure: Structure;
    // Node の Map
    nodes: Record<string, Node>;
    // Beam の Map
    beams: Record<string, BeamProps>;
    // force の Map
    forces: Record<string, ForceProps>;
    // 構造データの更新
    setStructure: (structure: Structure) => void;
}

// Context | React TypeScript Cheatsheets
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const StructureContext = createContext<IStructureContext>(undefined!);

const StructureProvider: React.VFC<Props> = ({ children, structure: source, onChange }) => {
    const structure = useMemo(() => {
        // TODO: 単位変換
        return source;
    }, [source]);

    const nodes = useMemo(() => {
        const map: Record<string, Node> = {};

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

    const handleChange = useCallback(
        (payload: Structure) => {
            // TODO: 単位を元に戻す
            onChange && onChange(payload);
        },
        [onChange]
    );

    return (
        <StructureContext.Provider
            value={{
                structure,
                nodes,
                beams,
                forces,
                setStructure: handleChange,
            }}
        >
            {children}
        </StructureContext.Provider>
    );
};

export default StructureProvider;
