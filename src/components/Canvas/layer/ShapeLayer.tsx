import Konva from 'konva';
import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Layer } from 'react-konva';
import { isLinePoints } from '../../../types/common';
import { PopupParams } from '../popup/types';
import { CanvasContext } from '../provider/CanvasProvider';
import { PopupContext } from '../provider/PopupProvider';
import { Beam, Force, Node, Trapezoid } from '../shape';
import { BeamPoints } from '../types';
import { createForceParams, snap, Vector } from '../util';

export const ShapeLayer: React.VFC = () => {
    const {
        tool,
        readonly,
        nodes,
        nodeMap,
        beams,
        beamMap,
        forces,
        forceAverage,
        trapezoids,
        snapSize,
        onChangeNode,
        onCreateForce,
        onDeleteBeam,
        onDeleteForce,
        onDeleteTrapezoid,
        select,
        isSelected,
    } = useContext(CanvasContext);
    const { open } = useContext(PopupContext);

    const nodeRefs = useRef<Array<Konva.Circle | null>>([]);
    const beamRefs = useRef<Array<Konva.Line | null>>([]);
    const layerRef = useRef<Konva.Layer>(null);

    // nodes, beams の数が変わったら refs の配列を詰める
    useEffect(() => {
        nodeRefs.current = nodeRefs.current.slice(0, nodes.length);
    }, [nodes.length]);
    useEffect(() => {
        beamRefs.current = beamRefs.current.slice(0, beams.length);
    }, [beams.length]);

    const [draggingNode, setDraggingNode] = useState<string>();

    const isNodeDraggable = useMemo(() => {
        return !readonly && tool === 'select';
    }, [readonly, tool]);

    // ドラッグ位置
    const dragPointRef = useRef<Vector>(new Vector(0, 0));
    // ドラッグ中の描画タイマー
    const timerRef = useRef<NodeJS.Timer>();

    /**
     * beam の座標を返す
     */
    const getBeamPoints = useCallback(
        (nodeI: string, nodeJ: string): BeamPoints => {
            const ni = nodeMap[nodeI];
            const nj = nodeMap[nodeJ];
            return [ni.x, ni.y, nj.x, nj.y];
        },
        [nodeMap]
    );
    const getBeamPointsByBeamId = useCallback(
        (beamId) => {
            const beam = beamMap[beamId];
            return getBeamPoints(beam.nodeI, beam.nodeJ);
        },
        [beamMap, getBeamPoints]
    );

    /**
     * 梁要素のクリック
     */
    const handleClickBeam = useCallback(
        (event: KonvaEventObject<Event>) => {
            let cancelBubble = false;
            if (tool === 'select') {
                // 梁要素の選択
                select({ type: 'beams', id: event.target.id() });
                cancelBubble = true;
            } else if (tool === 'delete') {
                // 梁要素の削除
                onDeleteBeam(event.target.id());
                cancelBubble = true;
            } else if (tool === 'force') {
                // クリック位置
                const point = event.target.getStage()?.getPointerPosition();
                // 梁要素の位置
                const points = event.target.attrs.points;
                if (point && isLinePoints(points)) {
                    // 集中荷重の追加
                    const params = createForceParams(
                        event.target.id(),
                        new Vector(points[0], points[1]),
                        new Vector(points[2], points[3]),
                        new Vector(point.x, point.y)
                    );
                    const name = `Force_${forces.length}`;
                    onCreateForce({ ...params, name });
                    cancelBubble = true;
                }
            }

            event.cancelBubble = cancelBubble;
        },
        [forces.length, onCreateForce, onDeleteBeam, select, tool]
    );

    /**
     * 節点のダブルクリック（ピン選択ダイアログの表示）
     */
    const handleDblClickNode = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                // クリック位置
                const point = event.target.getStage()?.getPointerPosition();
                // 対象 node
                const node = nodes.find(({ id }) => id === event.target.id());
                if (point && node) {
                    // Node を Record<string, unknown> にキャストするために
                    // 一旦 unknown にキャストする
                    open('nodes', { top: point.y, left: point.x }, node as unknown as PopupParams);
                }
            }
        },
        [nodes, open, tool]
    );

    /**
     * node ドラッグ時の描画処理
     */
    const draw = useCallback(() => {
        if (draggingNode) {
            const { x, y } = dragPointRef.current;
            // ドラッグ中の node に紐づく beam を更新する
            beamRefs.current.forEach((beam) => {
                if (beam) {
                    const { nodeI, nodeJ } = beam.attrs;
                    const points = beam.points();
                    if (nodeI === draggingNode) {
                        beam.points([x, y, points[2], points[3]]);
                    }
                    if (nodeJ === draggingNode) {
                        beam.points([points[0], points[1], x, y]);
                    }
                }
            });
        }
    }, [draggingNode]);

    /**
     * 節点のドラッグ開始
     */
    const handleDragStartNode = useCallback((event: KonvaEventObject<Event>) => {
        // ポインタ位置
        const point = event.target.getStage()?.getPointerPosition();
        if (point) {
            // ドラッグ中の節点ID
            setDraggingNode(event.target.id());
            // ドラッグ開始位置を保持
            dragPointRef.current.x = point.x;
            dragPointRef.current.y = point.y;
        }
    }, []);

    useEffect(() => {
        if (typeof draggingNode !== 'undefined') {
            if (timerRef.current) {
                // もし実行中のタイマーがあったらキャンセル
                clearInterval(timerRef.current);
            }

            timerRef.current = setInterval(draw, 100);
        }
    }, [draggingNode, draw]);

    /**
     * ドラッグによる node 移動
     */
    const handleDragMoveNode = useCallback((event: KonvaEventObject<Event>) => {
        // ポインタ位置
        const point = event.target.getStage()?.getPointerPosition();
        if (point) {
            // ドラッグ開始位置を保持
            dragPointRef.current.x = point.x;
            dragPointRef.current.y = point.y;
        }
    }, []);

    /**
     * node のドラッグ終了
     */
    const handleDragEndNode = useCallback(
        (event: KonvaEventObject<Event>) => {
            // ポインタ位置
            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                if (timerRef.current) {
                    // 描画終了
                    clearInterval(timerRef.current);
                }
                // ドラッグ開始位置をリセット
                dragPointRef.current.x = 0;
                dragPointRef.current.y = 0;
                // ドラッグ対象 node をリセット
                setDraggingNode(undefined);

                // 更新処理
                const [px, py] = snap([point.x, point.y], snapSize);
                onChangeNode({
                    id: event.target.id(),
                    x: px,
                    y: py,
                    pin: event.target.attrs.pin,
                });
            }
        },
        [onChangeNode, snapSize]
    );

    /**
     * force のクリック
     */
    const handleClickForce = useCallback(
        (event: KonvaEventObject<Event>) => {
            const forceId = event.currentTarget.id();
            let cancelBubble = false;

            if (tool === 'select') {
                select({ type: 'forces', id: forceId });
                cancelBubble = true;
            } else if (tool === 'delete') {
                onDeleteForce(forceId);
                cancelBubble = true;
            }

            event.cancelBubble = cancelBubble;
        },
        [onDeleteForce, select, tool]
    );

    /**
     * 集中荷重のダブルクリック（荷重値の入力ダイアログを表示）
     */
    const handleDblClickForce = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                // クリック位置
                const point = event.target.getStage()?.getPointerPosition();
                // 対象 force
                const force = forces.find(({ id }) => id === event.currentTarget.id());
                if (point && force) {
                    open(
                        'forces',
                        { top: point.y, left: point.x },
                        force as unknown as PopupParams
                    );
                }
            }
        },
        [forces, open, tool]
    );

    /**
     * 分布荷重のクリック
     */
    const handleClickTrapezoid = useCallback(
        (event: KonvaEventObject<Event>) => {
            const id = event.currentTarget.id();
            let cancelBubble = false;

            if (tool === 'select') {
                select({ type: 'trapezoids', id });
                cancelBubble = true;
            } else if (tool === 'delete') {
                onDeleteTrapezoid(id);
                cancelBubble = true;
            }

            event.cancelBubble = cancelBubble;
        },
        [onDeleteTrapezoid, select, tool]
    );

    /**
     * 分布荷重のダブルクリック（編集ダイアログの表示）
     */
    const handleDblClickTrapezoid = useCallback(
        (event: KonvaEventObject<Event>) => {
            if (tool === 'select') {
                // クリック位置
                const point = event.target.getStage()?.getPointerPosition();
                // 対象要素
                const trapezoid = trapezoids.find(({ id }) => id === event.currentTarget.id());
                if (point && trapezoid) {
                    open(
                        'trapezoids',
                        { top: point.y, left: point.x },
                        trapezoid as unknown as PopupParams
                    );
                }
            }
        },
        [open, tool, trapezoids]
    );

    return (
        <Layer ref={layerRef}>
            {beams.map((beam, i) => (
                <Beam
                    key={beam.id}
                    ref={(el) => (beamRefs.current[i] = el)}
                    {...beam}
                    points={getBeamPoints(beam.nodeI, beam.nodeJ)}
                    selected={isSelected({ type: 'beams', id: beam.id })}
                    onClick={handleClickBeam}
                />
            ))}
            {nodes.map((node, i) => (
                <Node
                    key={node.id}
                    ref={(el) => (nodeRefs.current[i] = el)}
                    {...node}
                    draggable={isNodeDraggable}
                    isDragging={draggingNode === node.id}
                    onDblClick={handleDblClickNode}
                    onDragStart={handleDragStartNode}
                    onDragMove={handleDragMoveNode}
                    onDragEnd={handleDragEndNode}
                />
            ))}
            {forces.map((force) => (
                <Force
                    key={force.id}
                    {...force}
                    ratio={force.force / forceAverage}
                    points={getBeamPointsByBeamId(force.beam)}
                    visible={!Boolean(draggingNode)}
                    selected={isSelected({ type: 'forces', id: force.id })}
                    onClick={handleClickForce}
                    onDblClick={handleDblClickForce}
                />
            ))}
            {trapezoids.map((trapezoid) => (
                <Trapezoid
                    key={trapezoid.id}
                    {...trapezoid}
                    points={getBeamPointsByBeamId(trapezoid.beam)}
                    visible={!Boolean(draggingNode)}
                    selected={isSelected({ type: 'trapezoids', id: trapezoid.id })}
                    onClick={handleClickTrapezoid}
                    onDblClick={handleDblClickTrapezoid}
                />
            ))}
        </Layer>
    );
};

export default ShapeLayer;
