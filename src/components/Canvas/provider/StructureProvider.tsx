import { createContext, Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { CanvasTool, DOMSize } from '../../../types/common';
import { Force, Node, Structure } from '../../../types/shape';
import { BeamProps, ForceProps } from '../types';
import { clone, createForce } from '../util';

interface Props {
    children: React.ReactNode;
    size: DOMSize;
    tool?: CanvasTool;
    structure: Structure;
    setStructure?: Dispatch<SetStateAction<Structure>>;
}

type AddForceFunction = (params: Omit<Force, 'id' | 'name'>) => void;

interface IStructureContext {
    // 選択されているツール
    tool: CanvasTool;
    // キャンバスのサイズ
    size: DOMSize;
    // 単位変換された構造データ
    structure: Structure;
    // Node の Map
    nodes: Record<string, Node>;
    // Beam の Map
    beams: Record<string, BeamProps>;
    // force の Map
    forces: Record<string, ForceProps>;
    // 集中荷重の追加
    addForce: AddForceFunction;
    // 構造データの更新
    setStructure?: Dispatch<SetStateAction<Structure>>;
}

// Context | React TypeScript Cheatsheets
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const StructureContext = createContext<IStructureContext>(undefined!);

const StructureProvider: React.VFC<Props> = ({
    children,
    tool = 'select',
    size,
    structure,
    setStructure,
}) => {
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

    const addForce = useCallback(
        (params: Omit<Force, 'id' | 'name'>) => {
            const data = clone(structure);
            const name = `Force_${data.forces.length + 1}`;
            const force = createForce({ name, ...params });
            data.forces.push(force);
            setStructure && setStructure(data);
        },
        [setStructure, structure]
    );

    return (
        <StructureContext.Provider
            value={{
                tool,
                size,
                structure,
                nodes,
                beams,
                forces,
                addForce,
                setStructure,
            }}
        >
            {children}
        </StructureContext.Provider>
    );
};

export default StructureProvider;
