import { createContext, Dispatch, SetStateAction, useCallback, useMemo } from 'react';
import { CanvasTool, DOMSize } from '../../../types/common';
import { Force, Node, Structure } from '../../../types/shape';
import { BeamProps, ForceProps } from '../types';
import { clone, createForce } from '../util';

interface Props {
    children: React.ReactNode;
    size: DOMSize;
    gridSize?: number;
    snapSize?: number;
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
    // グリッドの幅
    gridSize: number;
    // スナップする単位
    snapSize: number;
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
    // 集中荷重の削除
    deleteForce: (id: string) => void;
    // 梁要素の削除
    deleteBeam: (id: string) => void;
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
    gridSize = 25,
    snapSize = 25,
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

    const deleteForce = useCallback(
        (id: string) => {
            const index = structure.forces.findIndex(({ id: itemId }) => itemId === id);
            if (index >= 0) {
                const data = clone(structure);
                data.forces.splice(index, 1);
                setStructure && setStructure(data);
            }
        },
        [setStructure, structure]
    );

    const deleteBeam = useCallback(
        (id: string) => {
            const index = structure.beams.findIndex(({ id: itemId }) => itemId === id);
            if (index >= 0) {
                const { nodeI, nodeJ } = structure.beams[index];
                // 梁要素を削除
                const data = clone(structure);
                data.beams.splice(index, 1);

                // beam の両端の節点について、該当 beam 以外で使用していなければ削除
                [nodeI, nodeJ].forEach((node) => {
                    // 他 beam で使用されていないかチェック
                    const exists = data.beams.some(({ nodeI: i, nodeJ: j }) => {
                        return node === i || node === j;
                    });

                    if (!exists) {
                        // 該当 node を削除
                        const i = data.nodes.findIndex(({ id: nodeId }) => nodeId === node);
                        if (i >= 0) {
                            data.nodes.splice(i, 1);
                        }
                    }
                });

                // beam に紐づく集中荷重を削除
                const forces = data.forces.filter(({ beam }) => beam !== id);
                data.forces = forces;
                // beam に紐づく分布荷重を削除
                const trapezoids = data.trapezoids.filter(({ beam }) => beam !== id);
                data.trapezoids = trapezoids;

                setStructure && setStructure(data);
            }
        },
        [setStructure, structure]
    );

    return (
        <StructureContext.Provider
            value={{
                tool,
                size,
                gridSize,
                snapSize,
                structure,
                nodes,
                beams,
                forces,
                addForce,
                deleteForce,
                deleteBeam,
                setStructure,
            }}
        >
            {children}
        </StructureContext.Provider>
    );
};

export default StructureProvider;
