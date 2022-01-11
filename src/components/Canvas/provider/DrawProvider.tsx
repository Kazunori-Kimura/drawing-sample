import { KonvaEventObject } from 'konva/lib/Node';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react';
import { isNumberArray } from '../../../types/common';
import { clone, createBeam, createNode, createTrapezoid, DEFAULT_SNAP_SIZE, snap } from '../util';
import { StructureContext } from './StructureProvider';

interface IDrawContext {
    points: number[];
    onPointerDown: (event: KonvaEventObject<Event>) => void;
    onPointerMove: (event: KonvaEventObject<Event>) => void;
    onPointerUp: (event: KonvaEventObject<Event>) => void;
}

interface Props {
    children: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const DrawContext = createContext<IDrawContext>(undefined!);

type BeamAttrs = {
    id: string;
    points: number[];
};

const DrawProvider: React.VFC<Props> = ({ children }) => {
    const { tool, readonly = false, setStructure } = useContext(StructureContext);
    // 描画する点
    const [points, setPoints] = useState<number[]>([]);

    const isDrawing = useRef<boolean>();
    const beamRef = useRef<BeamAttrs>();

    const disabled = useMemo(() => {
        if (!readonly) {
            return !(tool === 'pen' || tool === 'trapezoid');
        }
        return true;
    }, [readonly, tool]);

    const handlePointerDown = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (disabled) {
                return;
            }

            if (tool === 'trapezoid') {
                // 梁要素の選択でなければ無視する
                if (event.target.attrs['type'] !== 'beam') {
                    return;
                }
                const beamId = event.target.attrs['id'];
                const beamPoints = event.target.attrs['points'];
                if (isNumberArray(beamPoints) && typeof beamId === 'string') {
                    beamRef.current = {
                        id: beamId,
                        points: beamPoints,
                    };
                }
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                isDrawing.current = true;
                setPoints([point.x, point.y]);
            }
        },
        [disabled, setPoints, tool]
    );

    const handlePointerMove = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (disabled) {
                return;
            }
            if (!isDrawing.current) {
                return;
            }

            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                setPoints((state) => [...state, point.x, point.y]);
            }
        },
        [disabled, setPoints]
    );

    const makeBeam = useCallback(
        (start: number[], end: number[]) => {
            if (setStructure) {
                // スナップさせる
                const edgeI = snap([start[0], start[1]], DEFAULT_SNAP_SIZE);
                const edgeJ = snap([end[0], end[1]], DEFAULT_SNAP_SIZE);

                setStructure((structure) => {
                    const data = clone(structure);
                    const nodeI = createNode(...edgeI);
                    // 同一座標の節点が存在するか？
                    const n1 = data.nodes.find((node) => node.x === nodeI.x && node.y === nodeI.y);
                    if (n1) {
                        // 既存の節点を使用する
                        nodeI.id = n1.id;
                    } else {
                        // 新規追加
                        data.nodes.push(nodeI);
                    }

                    const nodeJ = createNode(...edgeJ);
                    const n2 = data.nodes.find((node) => node.x === nodeJ.x && node.y === nodeJ.y);
                    if (n2) {
                        // 既存の節点を使用する
                        nodeJ.id = n2.id;
                    } else {
                        // 新規追加
                        data.nodes.push(nodeJ);
                    }

                    const name = `Beam_${data.beams.length + 1}`;
                    const beam = createBeam(name, nodeI.id, nodeJ.id);
                    data.beams.push(beam);

                    return data;
                });
            }
        },
        [setStructure]
    );

    const makeTrapezoid = useCallback(
        (start: number[], end: number[], attrs: BeamAttrs) => {
            if (setStructure) {
                // 分布荷重の登録
                const trapezoid = createTrapezoid(start, end, attrs.id, attrs.points);
                setStructure((structure) => {
                    const data = clone(structure);

                    // 分布荷重を追加
                    const name = `Trapezoid_${data.trapezoids.length + 1}`;
                    trapezoid.name = name;
                    data.trapezoids.push(trapezoid);

                    return data;
                });
            }
        },
        [setStructure]
    );

    const handlePointerUp = useCallback(
        (_: KonvaEventObject<Event>) => {
            if (disabled) {
                return;
            }

            if (isDrawing.current) {
                isDrawing.current = false;

                if (points.length >= 4) {
                    // 開始点
                    const start = points.slice(0, 2);
                    // 終了点
                    const end = points.slice(-2);

                    if (tool === 'pen') {
                        // 梁要素の生成
                        makeBeam(start, end);
                    } else if (tool === 'trapezoid' && beamRef.current) {
                        // 分布荷重の生成
                        makeTrapezoid(start, end, beamRef.current);
                    }

                    setPoints([]);
                    beamRef.current = undefined;
                }
            }
        },
        [disabled, makeBeam, makeTrapezoid, points, setPoints, tool]
    );

    return (
        <DrawContext.Provider
            value={{
                points,
                onPointerDown: handlePointerDown,
                onPointerMove: handlePointerMove,
                onPointerUp: handlePointerUp,
            }}
        >
            {children}
        </DrawContext.Provider>
    );
};

export default DrawProvider;
