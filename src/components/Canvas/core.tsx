import { fabric } from 'fabric';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { CanvasTool, ShapePosition } from '../../types/common';
import { defaultCanvasProps, StructureCanvasProps } from '../../types/note';
import { isBeam, isForce, isNode, isTrapezoid } from '../../types/shape';
import {
    BeamShape,
    calcForceAverage,
    calcTrapezoidAverage,
    createBeam,
    createBeamGuideLine,
    createForce,
    createGlobalGuideLine,
    createGrid,
    createNode,
    createNodePin,
    createTrapezoid,
    createTrapezoidGuideLine,
    ForceShape,
    NodeShape,
    TrapezoidShape,
    updateBeam,
    updateNode,
} from './factory';
import { PopupContext } from './provider/PopupProvider';
import { BeamPoints, CanvasCoreHandler } from './types';
import { getPointerPosition, snap } from './util';

interface Props extends StructureCanvasProps {
    readonly?: boolean;
    tool: CanvasTool;
    snapSize?: number;
    gridSize?: number;
}

/**
 * 長押しの時間 (ms)
 */
const LongpressInterval = 1000;

const CanvasCore: React.ForwardRefRenderFunction<CanvasCoreHandler, Props> = (
    { tool, width, height, viewport, zoom, readonly = false, data, snapSize = 25, gridSize = 25 },
    ref
) => {
    const { open } = useContext(PopupContext);

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas>();
    const toolRef = useRef<CanvasTool>('select');

    const enablePan = useRef(false);
    const isCanvasDragging = useRef(false);
    const lastPos = useRef<ShapePosition>({ x: 0, y: 0 });
    const longpressTimer = useRef<NodeJS.Timer>();
    const draggingNode = useRef('');

    useImperativeHandle(ref, () => ({
        // TODO: 実装
        toDataURL: () => 'hoge',
        getStructure: () => defaultCanvasProps,
    }));

    /**
     * 節点ダイアログの表示
     */
    const openPinDialog = useCallback(
        (event: fabric.IEvent<Event>, shapes: NodeShape) => {
            if (fabricRef.current) {
                const node = shapes.node.data;
                const canvas = fabricRef.current;
                // ポインタの位置を取得する
                const { clientX: left, clientY: top } = getPointerPosition(event);
                // ダイアログを表示
                open(
                    'nodes',
                    { top, left },
                    node as unknown as Record<string, unknown>,
                    (values: Record<string, unknown>) => {
                        if (isNode(values)) {
                            // 節点のプロパティを更新
                            shapes.node.data = values;

                            // pin が更新されている場合
                            if (node.pin !== values.pin) {
                                if (shapes.pin) {
                                    // まずは前の pin を削除
                                    canvas.remove(shapes.pin);
                                }
                                // pin の作成
                                createNodePin(values, (image) => {
                                    console.log(image);
                                    shapes.pin = image;
                                    canvas.add(image);
                                });
                            }
                        }
                    }
                );
            }
        },
        [open]
    );

    // ツール選択に応じたモードの変更
    useEffect(() => {
        if (fabricRef.current) {
            if (tool === 'select' || tool === 'force' || tool === 'delete') {
                fabricRef.current.isDrawingMode = false;
                fabricRef.current.selection = tool === 'select';
                enablePan.current = true;
            } else {
                fabricRef.current.isDrawingMode = true;
                fabricRef.current.selection = false;
                enablePan.current = false;
            }
            toolRef.current = tool;
        }
    }, [tool]);

    // 初期化
    useEffect(() => {
        if (canvasRef.current) {
            let canvas: fabric.Canvas;
            // すでに fabricRef が定義済みなら破棄
            if (fabricRef.current) {
                console.log('dispose canvas.');

                canvas = fabricRef.current;
                canvas.clear();
                canvas.dispose();
                fabricRef.current = undefined;
            }

            canvas = new fabric.Canvas(canvasRef.current, {
                selection: true,
                isDrawingMode: false,
                stopContextMenu: true,
            });

            canvas.setZoom(zoom);
            canvas.setViewportTransform(viewport);

            // canvasイベント設定
            // http://fabricjs.com/fabric-intro-part-5
            canvas.on('mouse:down', (event: fabric.IEvent<MouseEvent | TouchEvent>) => {
                if (enablePan.current) {
                    let x = 0;
                    let y = 0;
                    if (event.e.type === 'touchstart') {
                        const { touches } = event.e as TouchEvent;
                        const { clientX, clientY } = touches[0];
                        x = clientX;
                        y = clientY;
                    } else {
                        const { clientX, clientY } = event.e as MouseEvent;
                        x = clientX;
                        y = clientY;
                    }
                    // ドラッグ開始
                    canvas.selection = false; // 選択範囲の矩形を出さない
                    isCanvasDragging.current = true;
                    lastPos.current = {
                        x,
                        y,
                    };
                }
            }); // canvas#mouse:down

            canvas.on('mouse:move', (event: fabric.IEvent<MouseEvent | TouchEvent>) => {
                if (isCanvasDragging.current) {
                    let x = 0;
                    let y = 0;
                    if (event.e.type === 'touchmove') {
                        const { touches } = event.e as TouchEvent;
                        const { clientX, clientY } = touches[0];
                        x = clientX;
                        y = clientY;
                    } else {
                        const { clientX, clientY } = event.e as MouseEvent;
                        x = clientX;
                        y = clientY;
                    }
                    const vpt = canvas.viewportTransform;
                    const zoom = canvas.getZoom();
                    const canvasWidth = canvas.getWidth();
                    const canvasHeight = canvas.getHeight();
                    if (vpt) {
                        let px = vpt[4];
                        let py = vpt[5];

                        // ページ幅がキャンバス幅に収まる
                        if (canvasWidth >= width * zoom) {
                            px = canvasWidth / 2 - (height * zoom) / 2;
                        } else {
                            px += x - lastPos.current.x;
                            if (px >= 0) {
                                px = 0;
                            } else if (px < canvasWidth - width * zoom) {
                                px = canvasWidth - width * zoom;
                            }
                        }
                        // ページ高がキャンバス高に収まる
                        if (canvasHeight >= height * zoom) {
                            py = canvasHeight / 2 - (height * zoom) / 2;
                        } else {
                            py += y - lastPos.current.y;
                            if (py >= 0) {
                                py = 0;
                            } else if (py < canvasHeight - height * zoom) {
                                py = canvasHeight - height * zoom;
                            }
                        }

                        vpt[4] = px;
                        vpt[5] = py;

                        canvas.requestRenderAll();
                    }

                    lastPos.current = {
                        x,
                        y,
                    };
                }
            }); // canvas#mouse:move

            canvas.on('mouse:up', () => {
                if (isCanvasDragging.current) {
                    const vpt = canvas.viewportTransform;
                    if (vpt) {
                        canvas.setViewportTransform(vpt);
                    }
                }
                // ドラッグ終了
                isCanvasDragging.current = false;
                // 複数選択を可能にする
                canvas.selection = true;
            }); // canvas#mouse:up

            // 要素が選択されたらパンを無効にする
            canvas.on('selection:created', () => {
                enablePan.current = false;
            });
            canvas.on('selection:updated', () => {
                enablePan.current = false;
            });
            // 要素の選択が解除されたらパンを有効にする
            canvas.on('selection:cleared', () => {
                enablePan.current = true;
            });

            // 背景の描画
            const lines = createGrid(canvas.width ?? 0, canvas.height ?? 0, gridSize);
            canvas.add(...lines);

            // 構造データを描画
            const { nodes, beams, forces, trapezoids } = data;
            let forceAverage = 0;
            let trapezoidAverage = 0;
            const nodeMap: Record<string, NodeShape> = {};
            const beamMap: Record<string, BeamShape> = {};
            const nodeBeamMap: Record<string, BeamShape[]> = {};
            // beamId と force の矢印・ラベルの組み合わせ
            const forceMap: Record<string, ForceShape[]> = {};
            // beamId と trapezoid の矢印・ラベルの組み合わせ
            const trapezoidMap: Record<string, TrapezoidShape[]> = {};
            const guidePointsX = new Set<number>();
            const guidePointsY = new Set<number>();

            // 節点
            nodes.forEach((node) => {
                // 節点
                const nodeShape = createNode(
                    node,
                    {
                        // readonly時はイベントに反応しない
                        selectable: !readonly,
                        evented: !readonly,
                    },
                    (image) => {
                        nodeShape.pin = image;
                        canvas.add(image);
                    }
                );

                // 補助線描画のために x, y 座標を保持
                guidePointsX.add(node.x);
                guidePointsY.add(node.y);

                // 節点をダブルクリック/長押しするとピン選択ダイアログが表示される
                nodeShape.node.on('mousedown', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current !== 'select') {
                        // 選択モード時以外は何もしない
                        if (event.target) {
                            // 移動不可
                            event.target.lockMovementX = true;
                            event.target.lockMovementY = true;
                        }
                        return;
                    }
                    // すでに他で長押しイベントが実行されている場合はキャンセル
                    if (longpressTimer.current) {
                        clearTimeout(longpressTimer.current);
                        longpressTimer.current = undefined;
                    }

                    if (event.target) {
                        const shape = event.target;
                        // 移動可
                        shape.lockMovementX = false;
                        shape.lockMovementY = false;

                        // 長押し前の現在位置を保持する
                        const { top: beforeTop, left: beforeLeft } = shape.getBoundingRect(
                            true,
                            true
                        );

                        // 長押しイベント
                        longpressTimer.current = setTimeout(() => {
                            // 長押し後の現在位置
                            const { top: afterTop, left: afterLeft } = shape.getBoundingRect(
                                true,
                                true
                            );
                            // 位置が変わっていなければ longpress とする
                            if (beforeTop === afterTop && beforeLeft === afterLeft) {
                                // ダイアログの表示
                                openPinDialog(event, nodeShape);
                            }
                            longpressTimer.current = undefined;
                        }, LongpressInterval);
                    }
                });
                nodeShape.node.on('mouseup', () => {
                    if (longpressTimer.current) {
                        clearTimeout(longpressTimer.current);
                        longpressTimer.current = undefined;
                    }
                });
                nodeShape.node.on('mousedblclick', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select') {
                        // ダイアログの表示
                        openPinDialog(event, nodeShape);
                    }
                });

                // ドラッグで節点の移動
                // 梁要素（とそれに紐づく集中荷重、分布荷重）を追従して更新する
                nodeShape.node.on('moving', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select' && event.pointer) {
                        const { x, y } = event.pointer;
                        const nodeId = node.id;

                        if (draggingNode.current !== nodeId) {
                            if (nodeShape.pin) {
                                // pinの非表示
                                nodeShape.pin.visible = false;
                            }
                        }

                        // 該当の節点に紐づく梁要素を取得
                        const beams = nodeBeamMap[nodeId];
                        if (beams) {
                            beams.forEach(({ beam }) => {
                                const beamData = beam.data;
                                if (isBeam(beamData)) {
                                    const ni = nodeMap[beamData.nodeI];
                                    const nj = nodeMap[beamData.nodeJ];
                                    let ix = ni.data.x;
                                    let iy = ni.data.y;
                                    let jx = nj.data.x;
                                    let jy = nj.data.y;
                                    if (beamData.nodeI === nodeId) {
                                        // i端の移動
                                        ix = x;
                                        iy = y;
                                    } else if (beamData.nodeJ === nodeId) {
                                        // j端の移動
                                        jx = x;
                                        jy = y;
                                    }

                                    // 梁要素の再描画
                                    updateBeam(beam, [ix, iy, jx, jy]);

                                    // 集中荷重、分布荷重を非表示とする
                                    if (draggingNode.current !== nodeId) {
                                        // 集中荷重の非表示
                                        const forceShapes = forceMap[beamData.id];
                                        if (forceShapes) {
                                            forceShapes.forEach(({ force, label }) => {
                                                force.visible = false;
                                                label.visible = false;
                                            });
                                        }
                                        // 分布荷重の非表示
                                        const trapezoidShapes = trapezoidMap[beamData.id];
                                        if (trapezoidShapes) {
                                            trapezoidShapes.forEach(
                                                ({ arrows, line, labels, guide }) => {
                                                    arrows.forEach((arrow) => {
                                                        arrow.visible = false;
                                                    });
                                                    line.visible = false;
                                                    labels.forEach((label) => {
                                                        label.visible = false;
                                                    });
                                                    if (guide) {
                                                        guide.visible = false;
                                                    }
                                                }
                                            );
                                        }
                                    }
                                }
                            }); // beams.forEach
                        }

                        // ドラッグ中の nodeId を保持
                        draggingNode.current = nodeId;
                    }
                }); // node#moving

                nodeShape.node.on('moved', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select' && event.target) {
                        // ドラッグされた節点
                        const nodeId = node.id;
                        // 現在位置をスナップ
                        const { x, y } = event.target.getCenterPoint();
                        const [sx, sy] = snap([x, y], snapSize);

                        // 節点の更新
                        updateNode(nodeShape, sx, sy);

                        // 該当の節点に紐づく梁要素を取得
                        const beams = nodeBeamMap[nodeId];
                        if (beams) {
                            // 削除対象の梁要素
                            const removingBeams: string[] = [];

                            // 梁要素の再描画
                            beams.forEach((beamShape) => {
                                const { data: beamData, beam, guide } = beamShape;
                                const ni = nodeMap[beamData.nodeI];
                                const nj = nodeMap[beamData.nodeJ];

                                // nodeI と nodeJ の座標が一致する場合、この梁要素を削除する
                                if (ni.data.x === nj.data.x && ni.data.y === nj.data.y) {
                                    removingBeams.push(beamData.id);
                                    return;
                                }

                                // 梁要素の再描画
                                const points: BeamPoints = [
                                    ni.data.x,
                                    ni.data.y,
                                    nj.data.x,
                                    nj.data.y,
                                ];
                                updateBeam(beam, points);

                                // 集中荷重を更新
                                const forces = forceMap[beamData.id];
                                if (forces) {
                                    const newForces: ForceShape[] = [];
                                    forces.forEach((forceShape) => {
                                        const data = forceShape.force.data;

                                        // キャンバスから集中荷重を削除
                                        canvas.remove(forceShape.force, forceShape.label);

                                        if (isForce(data)) {
                                            const fs = createForce(data, points, forceAverage);
                                            newForces.push(fs);
                                            // キャンバスに追加
                                            canvas.add(fs.force);
                                            canvas.add(fs.label);
                                        }
                                    });
                                    forceMap[beamData.id] = newForces;
                                }

                                // 分布荷重を更新
                                const trapezoids = trapezoidMap[beamData.id];
                                if (trapezoids) {
                                    const newTrapezoids: TrapezoidShape[] = [];
                                    trapezoids.forEach((shape) => {
                                        // 分布荷重の上端からデータを取得する
                                        const data = shape.line.data;
                                        // キャンバスから分布荷重を削除
                                        canvas.remove(...shape.arrows, shape.line, ...shape.labels);
                                        if (shape.guide) {
                                            canvas.remove(shape.guide);
                                        }

                                        if (isTrapezoid(data)) {
                                            const ts = createTrapezoid(
                                                points,
                                                trapezoidAverage,
                                                data
                                            );
                                            const guide = createTrapezoidGuideLine(
                                                points,
                                                data.distanceI,
                                                data.distanceJ
                                            );
                                            guide.visible = false;
                                            ts.guide = guide;
                                            newTrapezoids.push(ts);

                                            canvas.add(
                                                ...ts.arrows,
                                                ts.line,
                                                ...ts.labels,
                                                ts.guide
                                            );
                                        }
                                    });
                                    trapezoidMap[beamData.id] = newTrapezoids;
                                }

                                // 寸法線を更新
                                if (guide) {
                                    canvas.remove(guide);
                                    const g = createBeamGuideLine(points);
                                    g.visible = false;
                                    beamShape.guide = g;
                                }
                            }); // beams.forEach

                            // 長さ 0 となった梁要素を削除
                            removingBeams.forEach((beamId) => {
                                // 集中荷重を削除
                                const forces = forceMap[beamId];
                                if (forces) {
                                    forces.forEach(({ force, label }) => {
                                        canvas.remove(force, label);
                                    });
                                    delete forceMap[beamId];

                                    // 平均値を更新
                                    const list = Object.values(forceMap).flatMap((shapes) =>
                                        shapes.map((shape) => shape.data)
                                    );
                                    forceAverage = calcForceAverage(list);
                                }

                                // 分布荷重を削除
                                const trapezoids = trapezoidMap[beamId];
                                if (trapezoids) {
                                    trapezoids.forEach(({ arrows, line, labels, guide }) => {
                                        canvas.remove(...arrows, line, ...labels);
                                        if (guide) {
                                            canvas.remove(guide);
                                        }
                                    });
                                    delete trapezoidMap[beamId];

                                    // 平均値を更新
                                    const list = Object.values(trapezoidMap).flatMap((shapes) =>
                                        shapes.map((shape) => shape.data)
                                    );
                                    trapezoidAverage = calcTrapezoidAverage(list);
                                }

                                // 梁要素を削除
                                const beam = beamMap[beamId];
                                if (beam) {
                                    canvas.remove(beam.beam);
                                    if (beam.guide) {
                                        canvas.remove(beam.guide);
                                    }
                                    delete beamMap[beamId];
                                }
                            });
                        }

                        // 同一座標の節点が存在する場合にドラッグした節点とマージする
                        const removingNodes: string[] = [];

                        // 絶対に大丈夫だけど念の為に空配列を準備しておく
                        if (typeof nodeBeamMap[nodeId] === 'undefined') {
                            nodeBeamMap[nodeId] = [];
                        }

                        Object.values(nodeMap).forEach((ns) => {
                            if (ns.data.id !== nodeId && ns.data.x === sx && ns.data.y === sy) {
                                // 削除するために id を保持
                                removingNodes.push(ns.data.id);

                                // canvas から節点を除去
                                canvas.remove(ns.node);
                                if (ns.pin) {
                                    canvas.remove(ns.pin);
                                }

                                // 同一座標の節点に紐づく梁要素
                                const beams = nodeBeamMap[ns.data.id];
                                if (beams) {
                                    beams.forEach((beamShape) => {
                                        // 節点を付け替え
                                        if (beamShape.data.nodeI === ns.data.id) {
                                            beamShape.data.nodeI = nodeId;
                                        }
                                        if (beamShape.data.nodeJ === ns.data.id) {
                                            beamShape.data.nodeJ = nodeId;
                                        }
                                        beamShape.beam.data = {
                                            type: 'beam',
                                            ...beamShape.data,
                                        };

                                        // マージされた節点に参照を移動する
                                        nodeBeamMap[nodeId].push(beamShape);
                                    });

                                    // 同一座標の節点に紐づく梁要素の参照を削除
                                    delete nodeBeamMap[ns.data.id];
                                }
                            }
                        });
                        // 節点の参照を除去
                        removingNodes.forEach((rn) => {
                            delete nodeMap[rn];
                        });

                        // TODO: 全体の寸法線を更新する

                        draggingNode.current = '';
                    }
                }); // node#moved

                canvas.add(nodeShape.node);
                // 節点の参照を保持する
                nodeMap[node.id] = nodeShape;
            });

            // 梁要素
            beams.forEach((beam) => {
                // 節点を取得
                const nodeI = nodeMap[beam.nodeI];
                const nodeJ = nodeMap[beam.nodeJ];
                const points: BeamPoints = [nodeI.data.x, nodeI.data.y, nodeJ.data.x, nodeJ.data.y];

                // 梁要素の作成
                const shape = createBeam(points, beam, {
                    // readonly時はイベントに反応しない
                    selectable: !readonly,
                    evented: !readonly,
                });

                // 寸法線
                const guide = createBeamGuideLine(points);
                guide.visible = false;
                shape.guide = guide;

                // TODO: 梁要素のイベント
                // 梁要素を選択したら寸法線を表示
                shape.beam.on('mousedown', (event: fabric.IEvent<Event>) => {
                    console.log('beam:onMouseDown :', event);
                });
                // 梁要素を変更したら
                // - scale を保持して長さのみ変更
                // - 追従して節点、寸法線も更新
                // 削除処理

                canvas.add(shape.beam);
                canvas.add(guide);

                // 参照を保持する
                beamMap[beam.id] = shape;
                if (typeof nodeBeamMap[beam.nodeI] === 'undefined') {
                    nodeBeamMap[beam.nodeI] = [shape];
                } else {
                    nodeBeamMap[beam.nodeI].push(shape);
                }
                if (typeof nodeBeamMap[beam.nodeJ] === 'undefined') {
                    nodeBeamMap[beam.nodeJ] = [shape];
                } else {
                    nodeBeamMap[beam.nodeJ].push(shape);
                }
            });

            // 集中荷重の平均値を取得する
            forceAverage = calcForceAverage(forces);

            // 集中荷重
            forces.forEach((force) => {
                const beam = beamMap[force.beam];
                const nodeI = nodeMap[beam.data.nodeI];
                const nodeJ = nodeMap[beam.data.nodeJ];
                // 集中荷重の生成
                const shapes = createForce(
                    force,
                    [nodeI.data.x, nodeI.data.y, nodeJ.data.x, nodeJ.data.y],
                    forceAverage,
                    readonly
                );

                /// TODO: 集中荷重のイベント
                // 選択したらラベルを表示
                // 変更したら
                // - scale を保持して長さのみ変更
                // - ラベルを更新
                // 削除処理

                canvas.add(shapes.force, shapes.label);

                // 参照を保持する
                if (typeof forceMap[force.beam] === 'undefined') {
                    forceMap[force.beam] = [shapes];
                } else {
                    forceMap[force.beam].push(shapes);
                }
            }); // forces.forEach

            // 分布荷重の平均値
            trapezoidAverage = calcTrapezoidAverage(trapezoids);

            // 分布荷重
            trapezoids.forEach((trapezoid) => {
                const beam = beamMap[trapezoid.beam];
                const nodeI = nodeMap[beam.data.nodeI];
                const nodeJ = nodeMap[beam.data.nodeJ];
                // 分布荷重の生成
                const shapes = createTrapezoid(
                    [nodeI.data.x, nodeI.data.y, nodeJ.data.x, nodeJ.data.y],
                    trapezoidAverage,
                    trapezoid,
                    readonly
                );

                // 寸法線
                const guide = createTrapezoidGuideLine(
                    [nodeI.data.x, nodeI.data.y, nodeJ.data.x, nodeJ.data.y],
                    trapezoid.distanceI,
                    trapezoid.distanceJ
                );
                guide.visible = false;
                shapes.guide = guide;

                // TODO: 分布荷重のイベント
                // 選択したら寸法線を表示
                // 変更したら
                // - rotate
                // - scale
                // 削除処理

                canvas.add(...shapes.arrows, shapes.line, ...shapes.labels, guide);

                // 参照を保持
                if (typeof trapezoidMap[trapezoid.beam] === 'undefined') {
                    trapezoidMap[trapezoid.beam] = [shapes];
                } else {
                    trapezoidMap[trapezoid.beam].push(shapes);
                }
            }); // trapezoids.forEach

            // 全体の寸法線
            const guides = createGlobalGuideLine(guidePointsX, guidePointsY, canvas.height ?? 0);
            if (guides.length > 0) {
                canvas.add(...guides);
            }

            fabricRef.current = canvas;
        }
    }, [data, gridSize, height, openPinDialog, readonly, snapSize, viewport, width, zoom]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};

export default forwardRef(CanvasCore);
