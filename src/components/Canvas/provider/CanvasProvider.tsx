import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';
import { CanvasTool, DOMSize } from '../../../types/common';
import {
    Beam,
    Force,
    isBeam,
    isForce,
    isNode,
    isTrapezoid,
    Node,
    Structure,
    Trapezoid,
} from '../../../types/shape';
import { Shape } from '../types';
import { clone } from '../util';

interface Props {
    children: React.ReactNode;
    size: DOMSize;
    structure: Structure;
    gridSize?: number;
    snapSize?: number;
    tool?: CanvasTool;
    readonly?: boolean;
}

interface ICanvasContext {
    size: DOMSize;
    gridSize: number;
    snapSize: number;
    tool: CanvasTool;
    readonly: boolean;
    nodes: Node[];
    nodeMap: Record<string, Node>;
    beams: Beam[];
    beamMap: Record<string, Beam>;
    forces: Force[];
    trapezoids: Trapezoid[];
    forceAverage: number;
    onChangeNode: (value: Node) => void;
    onCreateNode: (value: Partial<Node> | Partial<Node>[]) => void;
    onDeleteNode: (id: string) => void;
    onChangeBeam: (value: Beam) => void;
    onCreateBeam: (value: Partial<Beam>) => void;
    onDeleteBeam: (id: string) => void;
    onChangeForce: (value: Force) => void;
    onCreateForce: (value: Partial<Force>) => void;
    onDeleteForce: (id: string) => void;
    onChangeTrapezoid: (value: Trapezoid) => void;
    onCreateTrapezoid: (value: Partial<Trapezoid>) => void;
    onDeleteTrapezoid: (id: string) => void;
    selected: Shape[];
    isSelected: (item: Shape) => boolean;
    select: (item: Shape) => void;
    toggleSelect: (item: Shape) => void;
    clearSelection: VoidFunction;
    getStructure: () => Structure;
}

// Context | React TypeScript Cheatsheets
// https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/context/
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const CanvasContext = createContext<ICanvasContext>(undefined!);

const CanvasProvider: React.VFC<Props> = ({
    children,
    structure: source,
    size,
    gridSize = 25,
    snapSize = 25,
    tool = 'select',
    readonly = false,
}) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [beams, setBeams] = useState<Beam[]>([]);
    const [forces, setForces] = useState<Force[]>([]);
    const [forceAverage, setForceAve] = useState<number>(0);
    const [trapezoids, setTrapezoids] = useState<Trapezoid[]>([]);
    // 選択要素
    const [selected, setSelected] = useState<Shape[]>([]);

    // props に渡された構造データから nodes, beams, forces, trapezoids を
    // 抜き出し、表示用に整形する
    useEffect(() => {
        const { nodes: n, beams: b, forces: f, trapezoids: t } = source;
        setNodes(n);
        setBeams(b);
        setForces(f);
        setTrapezoids(t);
    }, [source]);

    // 構造データを再生成する
    const getStructure = useCallback(() => {
        return {
            unit: source.unit,
            nodes,
            beams,
            forces,
            trapezoids,
        };
    }, [beams, forces, nodes, source.unit, trapezoids]);

    // 集中荷重の平均値を取得する
    useEffect(() => {
        // forces
        let ave = 0;
        if (forces.length > 0) {
            const { force: total } = forces.reduce((prev, current) => {
                const item: Force = {
                    ...prev,
                    force: prev.force + current.force,
                };
                return item;
            });
            ave = total / forces.length;
        }
        setForceAve(ave);
    }, [forces]);

    const nodeMap = useMemo(() => {
        const map: Record<string, Node> = {};
        nodes.forEach((node) => {
            map[node.id] = node;
        });
        return map;
    }, [nodes]);

    const beamMap = useMemo(() => {
        const map: Record<string, Beam> = {};
        beams.forEach((beam) => {
            map[beam.id] = beam;
        });
        return map;
    }, [beams]);

    const onChangeNode = useCallback(
        (value: Node) => {
            if (readonly) {
                return;
            }

            setNodes((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === value.id);
                if (index >= 0) {
                    const item = items[index];
                    items[index] = {
                        ...item,
                        ...value,
                    };
                }
                return items;
            });
        },
        [readonly]
    );

    const onCreateNode = useCallback(
        (value: Partial<Node> | Partial<Node>[]) => {
            if (readonly) {
                return;
            }

            const arr: Partial<Node>[] = [];

            if (Array.isArray(value)) {
                arr.push(...value);
            } else {
                arr.push(value);
            }

            const newNodes: Node[] = [];
            arr.forEach((item) => {
                if (typeof item.id === 'undefined') {
                    item.id = uuid();
                }
                if (isNode(item)) {
                    newNodes.push(item);
                }
            });

            setNodes((items) => [...items, ...newNodes]);
        },
        [readonly]
    );

    const onDeleteNode = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

            // 削除対象 node に紐づく beam を削除する
            setBeams((state) => {
                const items = clone(state);
                let index = items.findIndex(({ nodeI, nodeJ }) => nodeI === id || nodeJ === id);
                while (index >= 0) {
                    items.splice(index, 1);
                    index = items.findIndex(({ nodeI, nodeJ }) => nodeI === id || nodeJ === id);
                }
                return items;
            });

            setNodes((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === id);
                if (index >= 0) {
                    items.splice(index, 1);
                }
                return items;
            });
        },
        [readonly]
    );

    const onChangeBeam = useCallback(
        (value: Beam) => {
            if (readonly) {
                return;
            }

            setBeams((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === value.id);
                if (index >= 0) {
                    const item = items[index];
                    items[index] = {
                        ...item,
                        ...value,
                    };
                }
                return items;
            });
        },
        [readonly]
    );

    const onCreateBeam = useCallback(
        (value: Partial<Beam>) => {
            if (readonly) {
                return;
            }

            const item: Partial<Beam> = { ...value };

            if (typeof item.id === 'undefined') {
                item.id = uuid();
            }
            if (isBeam(item)) {
                setBeams((items) => [...items, item]);
            }
        },
        [readonly]
    );

    const onDeleteBeam = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

            // 該当 beam に紐づく Node を削除する
            const beam = beams.find((item) => item.id === id);
            if (beam) {
                // 削除対象 beam に紐づく Node
                const { nodeI, nodeJ } = beam;
                // 使用 node の Set
                const ns = new Set<string>();
                beams.forEach(({ id: beamId, nodeI: i, nodeJ: j }) => {
                    if (beamId !== id) {
                        ns.add(i);
                        ns.add(j);
                    }
                });

                setNodes((state) => {
                    const items = clone(state);
                    [nodeI, nodeJ].forEach((node) => {
                        if (!ns.has(node)) {
                            // 使用されていない node なので削除
                            const index = items.findIndex((item) => item.id === node);
                            if (index >= 0) {
                                items.splice(index, 1);
                            }
                        }
                    });
                    return items;
                });
            }

            // 該当 beam に紐づく Force, Trapezoids を削除する
            setForces((state) => {
                const items = clone(state);
                let index = items.findIndex((item) => item.beam === id);
                while (index >= 0) {
                    items.splice(index, 1);
                    index = items.findIndex((item) => item.beam === id);
                }
                return items;
            });
            setTrapezoids((state) => {
                const items = clone(state);
                let index = items.findIndex((item) => item.beam === id);
                while (index >= 0) {
                    items.splice(index, 1);
                    index = items.findIndex((item) => item.beam === id);
                }
                return items;
            });

            // beam を削除
            setBeams((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === id);
                if (index >= 0) {
                    items.splice(index, 1);
                }
                return items;
            });
        },
        [beams, readonly]
    );

    const onChangeForce = useCallback(
        (value: Force) => {
            if (readonly) {
                return;
            }

            setForces((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === value.id);
                if (index >= 0) {
                    const item = items[index];
                    items[index] = {
                        ...item,
                        ...value,
                    };
                }
                return items;
            });
        },
        [readonly]
    );

    const onCreateForce = useCallback(
        (value: Partial<Force>) => {
            if (readonly) {
                return;
            }

            const item: Partial<Force> = {
                ...value,
            };

            if (typeof item.id === 'undefined') {
                item.id = uuid();
            }
            if (isForce(item)) {
                setForces((items) => [...items, item]);
            }
        },
        [readonly]
    );

    const onDeleteForce = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

            setForces((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === id);
                if (index >= 0) {
                    items.splice(index, 1);
                }
                return items;
            });
        },
        [readonly]
    );

    const onChangeTrapezoid = useCallback(
        (value: Trapezoid) => {
            if (readonly) {
                return;
            }

            setTrapezoids((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === value.id);
                if (index >= 0) {
                    const item = items[index];
                    items[index] = {
                        ...item,
                        ...value,
                    };
                }
                return items;
            });
        },
        [readonly]
    );

    const onCreateTrapezoid = useCallback(
        (value: Partial<Trapezoid>) => {
            if (readonly) {
                return;
            }

            const item: Partial<Trapezoid> = {
                ...value,
            };
            if (typeof item.id === 'undefined') {
                item.id = uuid();
            }
            if (isTrapezoid(item)) {
                setTrapezoids((items) => [...items, item]);
            }
        },
        [readonly]
    );

    const onDeleteTrapezoid = useCallback(
        (id: string) => {
            if (readonly) {
                return;
            }

            setTrapezoids((state) => {
                const items = clone(state);
                const index = items.findIndex((item) => item.id === id);
                if (index >= 0) {
                    items.splice(index, 1);
                }
                return items;
            });
        },
        [readonly]
    );

    const isSelected = useCallback(
        (item: Shape) => {
            return selected.some(({ type, id }) => type === item.type && id === item.id);
        },
        [selected]
    );

    const select = useCallback(
        (item: Shape) => {
            if (!isSelected(item)) {
                setSelected((state) => [...state, item]);
            }
        },
        [isSelected, setSelected]
    );

    const toggleSelect = useCallback(
        (item: Shape) => {
            if (isSelected(item)) {
                // 削除
                setSelected((state) =>
                    state.filter(({ type, id }) => !(type === item.type && id === item.id))
                );
            } else {
                // 追加
                setSelected((state) => [...state, item]);
            }
        },
        [isSelected, setSelected]
    );

    const clearSelection = useCallback(() => {
        setSelected([]);
    }, []);

    return (
        <CanvasContext.Provider
            value={{
                size,
                gridSize,
                snapSize,
                tool,
                readonly,
                nodes,
                beams,
                forces,
                trapezoids,
                nodeMap,
                beamMap,
                forceAverage,
                onChangeNode,
                onCreateNode,
                onDeleteNode,
                onChangeBeam,
                onCreateBeam,
                onDeleteBeam,
                onChangeForce,
                onCreateForce,
                onDeleteForce,
                onChangeTrapezoid,
                onCreateTrapezoid,
                onDeleteTrapezoid,
                selected,
                isSelected,
                select,
                toggleSelect,
                clearSelection,
                getStructure,
            }}
        >
            {children}
        </CanvasContext.Provider>
    );
};

export default CanvasProvider;
