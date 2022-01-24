import { fabric } from 'fabric';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { CanvasTool, ShapePosition } from '../../types/common';
import { defaultCanvasProps, StructureCanvasProps } from '../../types/note';
import { Beam, Force, isNode, Node } from '../../types/shape';
import {
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
} from './factory';
import { PopupContext } from './provider/PopupProvider';
import { BeamPoints, CanvasCoreHandler } from './types';
import { getPointerPosition } from './util';

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
    {
        tool,
        width,
        height,
        viewport,
        zoom,
        readonly = false,
        data,
        // snapSize = 10,
        gridSize = 25,
    },
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

                                canvas.renderAll();
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
            });
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
            });
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
            });

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
            const nodeMap: Record<string, [Node, NodeShape]> = {};
            const beamMap: Record<string, [Beam, fabric.Line]> = {};
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

                // TODO: 節点のイベント
                // 節点をダブルクリック/長押しするとピン選択ダイアログが表示される
                nodeShape.node.on('mousedown', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current !== 'select') {
                        // 選択モード時以外は何もしない
                        return;
                    }
                    // すでに他で長押しイベントが実行されている場合はキャンセル
                    if (longpressTimer.current) {
                        clearTimeout(longpressTimer.current);
                        longpressTimer.current = undefined;
                    }

                    if (event.target) {
                        const shape = event.target;
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

                canvas.add(nodeShape.node);
                // 節点の参照を保持する
                nodeMap[node.id] = [node, nodeShape];
            });

            // 梁要素
            beams.forEach((beam) => {
                // 節点を取得
                const [nodeI] = nodeMap[beam.nodeI];
                const [nodeJ] = nodeMap[beam.nodeJ];
                const points: BeamPoints = [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y];

                // TODO: line と guide をひとつにまとめる
                const line = createBeam(points, {
                    name: beam.id,
                    data: {
                        type: 'beam',
                        ...beam,
                    },
                    // readonly時はイベントに反応しない
                    selectable: !readonly,
                    evented: !readonly,
                });

                // 寸法線
                const guide = createBeamGuideLine(points);
                guide.visible = false;

                // TODO: 梁要素のイベント
                // 梁要素を選択したら寸法線を表示
                // 梁要素を変更したら
                // - scale を保持して長さのみ変更
                // - 追従して節点、寸法線も更新
                // 削除処理

                canvas.add(line);
                canvas.add(guide);

                // 参照を保持する
                beamMap[beam.id] = [beam, line];
            });

            // 集中荷重の平均値を取得する
            let forceAverage = 0;
            if (forces.length > 0) {
                const { force: total } = forces.reduce((prev, current) => {
                    const item: Force = {
                        ...prev,
                        force: prev.force + current.force,
                    };
                    return item;
                });
                forceAverage = total / forces.length;
            }

            // 集中荷重
            forces.forEach((force) => {
                const [beam] = beamMap[force.beam];
                const [nodeI] = nodeMap[beam.nodeI];
                const [nodeJ] = nodeMap[beam.nodeJ];
                // 集中荷重の生成
                const shapes = createForce(
                    force,
                    [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y],
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
            });

            let trapezoidAverage = 0;
            if (trapezoids.length > 0) {
                const total = trapezoids
                    .map(({ forceI, forceJ }) => forceI + forceJ)
                    .reduce((prev, current) => prev + current);
                trapezoidAverage = total / (trapezoids.length * 2);
            }

            // 分布荷重
            trapezoids.forEach((trapezoid) => {
                const [beam] = beamMap[trapezoid.beam];
                const [nodeI] = nodeMap[beam.nodeI];
                const [nodeJ] = nodeMap[beam.nodeJ];
                // 分布荷重の生成
                const shapes = createTrapezoid(
                    [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y],
                    trapezoidAverage,
                    trapezoid,
                    readonly
                );

                // 寸法線
                const guide = createTrapezoidGuideLine(
                    [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y],
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
            });

            // 全体の寸法線
            const guides = createGlobalGuideLine(guidePointsX, guidePointsY, canvas.height ?? 0);
            if (guides.length > 0) {
                canvas.add(...guides);
            }

            fabricRef.current = canvas;
        }
    }, [data, gridSize, height, openPinDialog, readonly, viewport, width, zoom]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};

export default forwardRef(CanvasCore);
