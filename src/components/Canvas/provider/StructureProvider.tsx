import { createContext, Dispatch, SetStateAction, useCallback, useState } from 'react';
import { CanvasTool, DOMSize } from '../../../types/common';
import { Force, Structure } from '../../../types/shape';
import { clone, createForce } from '../util';

export interface StructureProviderProps {
    children: React.ReactNode;
    size: DOMSize;
    structure: Structure;
    gridSize?: number;
    snapSize?: number;
    tool?: CanvasTool;
    readonly?: boolean;
}

type AddForceFunction = (params: Omit<Force, 'id' | 'name'>) => void;

interface IStructureContext {
    // 選択されているツール
    tool: CanvasTool;
    // 編集可否
    readonly?: boolean;
    // キャンバスのサイズ
    size: DOMSize;
    // グリッドの幅
    gridSize: number;
    // スナップする単位
    snapSize: number;
    // 単位変換された構造データ
    structure: Structure;
    // 集中荷重の追加
    addForce: AddForceFunction;
    // 集中荷重の削除
    deleteForce: (id: string) => void;
    // 分布荷重の削除
    deleteTrapezoid: (id: string) => void;
    // 梁要素の削除
    deleteBeam: (id: string) => void;
    // 構造データの更新
    setStructure: Dispatch<SetStateAction<Structure>>;
}

// Context | React TypeScript Cheatsheets
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const StructureContext = createContext<IStructureContext>(undefined!);

const StructureProvider: React.VFC<StructureProviderProps> = ({
    children,
    tool = 'select',
    readonly = false,
    size,
    gridSize = 25,
    snapSize = 25,
    structure: source,
}) => {
    // データ
    const [structure, setStructure] = useState(source);

    const addForce = useCallback(
        (params: Omit<Force, 'id' | 'name'>) => {
            if (readonly) {
                return;
            }

            const data = clone(structure);
            const name = `Force_${data.forces.length + 1}`;
            const force = createForce({ name, ...params });
            data.forces.push(force);
            setStructure(data);
        },
        [readonly, structure]
    );

    const deleteForce = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

            const index = structure.forces.findIndex(({ id: itemId }) => itemId === id);
            if (index >= 0) {
                const data = clone(structure);
                data.forces.splice(index, 1);
                setStructure(data);
            }
        },
        [readonly, structure]
    );

    const deleteTrapezoid = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

            const index = structure.trapezoids.findIndex(({ id: itemId }) => itemId === id);
            if (index >= 0) {
                const data = clone(structure);
                data.trapezoids.splice(index, 1);
                setStructure(data);
            }
        },
        [readonly, structure]
    );

    const deleteBeam = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

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

                setStructure(data);
            }
        },
        [readonly, structure]
    );

    return (
        <StructureContext.Provider
            value={{
                tool,
                readonly,
                size,
                gridSize,
                snapSize,
                structure,
                addForce,
                deleteForce,
                deleteTrapezoid,
                deleteBeam,
                setStructure,
            }}
        >
            {children}
        </StructureContext.Provider>
    );
};

export default StructureProvider;
