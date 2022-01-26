import { fabric } from 'fabric';
import { forwardRef, useCallback, useContext, useEffect, useImperativeHandle, useRef } from 'react';
import { CanvasTool, ShapePosition } from '../../types/common';
import { defaultCanvasProps, StructureCanvasProps } from '../../types/note';
import { Force, isForce, isNode } from '../../types/shape';
import {
    BeamShape,
    calcBeamPoints,
    calcForceAverage,
    calcSnapedBeamPoints,
    calcTrapezoidAverage,
    createBeam,
    createBeamGuideLine,
    createForce,
    createGrid,
    createNode,
    createNodePin,
    createTrapezoid,
    createTrapezoidGuideLine,
    ForceShape,
    NodeShape,
    recreateBeamGuideLine,
    recreateForces,
    recreateGlobalGuideLines,
    recreateTrapezoids,
    removeBeam,
    removeNode,
    setVisibledToBeamParts,
    TrapezoidShape,
    updateBeam,
    updateForce,
    updateNode,
} from './factory';
import { PopupContext } from './provider/PopupProvider';
import { BeamPoints, CanvasCoreHandler } from './types';
import { getPointerPosition, snap, Vector, vY } from './util';

interface Props extends StructureCanvasProps {
    readonly?: boolean;
    tool: CanvasTool;
    snapSize?: number;
    gridSize?: number;
}

/**
 * ドラッグ中の梁要素の情報を保持する
 */
interface DraggingBeamInfo {
    target: BeamShape;
    nodeI: NodeShape;
    nodeJ: NodeShape;
    vi: Vector;
    vj: Vector;
    relationBeams: BeamShape[];
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
    const draggingBeam = useRef<DraggingBeamInfo>();

    useImperativeHandle(ref, () => ({
        // TODO: 実装
        toDataURL: () => 'hoge',
        getStructure: () => defaultCanvasProps,
    }));

    /**
     * 節点ダイアログの表示
     */
    const openPinDialog = useCallback(
        (event: fabric.IEvent<Event>, nodeShape: NodeShape) => {
            if (fabricRef.current) {
                const node = nodeShape.data;
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
                            nodeShape.data = values;
                            nodeShape.node.data = {
                                ...values,
                                type: 'node',
                            };

                            // pin が更新されている場合
                            if (node.pin !== values.pin) {
                                if (nodeShape.pin) {
                                    // まずは前の pin を削除
                                    canvas.remove(nodeShape.pin);
                                    nodeShape.pin = undefined;
                                }
                                // pin の作成
                                createNodePin(values, (image) => {
                                    nodeShape.pin = image;
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

    /**
     * 集中荷重のポップアップ表示
     */
    const openForceDialog = useCallback(
        (event: fabric.IEvent<Event>, forceShape: ForceShape, onChange: (force: Force) => void) => {
            if (fabricRef.current) {
                // ポインタの位置を取得する
                const { clientX: left, clientY: top } = getPointerPosition(event);
                // ダイアログを表示
                open(
                    'forces',
                    { top, left },
                    forceShape.data as unknown as Record<string, unknown>,
                    (values: Record<string, unknown>) => {
                        if (isForce(values)) {
                            // 更新処理
                            onChange(values);
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
            const globalGuideLines: fabric.Group[] = [];

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
                    // すでに他で長押しイベントが実行されている場合は
                    // タイマーをキャンセル
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
                            beams.forEach((beamShape) => {
                                const beamData = beamShape.data;

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
                                updateBeam(beamShape, [ix, iy, jx, jy]);

                                // 集中荷重、分布荷重を非表示とする
                                if (draggingNode.current !== nodeId) {
                                    setVisibledToBeamParts(
                                        beamShape,
                                        forceMap,
                                        trapezoidMap,
                                        false
                                    );
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
                                const { data: beamData } = beamShape;
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
                                updateBeam(beamShape, points);

                                // 集中荷重を更新
                                recreateForces(canvas, beamShape, forceMap, forceAverage);

                                // 分布荷重を更新
                                recreateTrapezoids(
                                    canvas,
                                    beamShape,
                                    trapezoidMap,
                                    trapezoidAverage
                                );

                                // 寸法線を更新
                                recreateBeamGuideLine(canvas, beamShape);
                            }); // beams.forEach

                            // 長さ 0 となった梁要素を削除
                            removingBeams.forEach((beamId) => {
                                removeBeam(
                                    canvas,
                                    beamId,
                                    beamMap,
                                    nodeBeamMap,
                                    forceMap,
                                    trapezoidMap
                                );
                            });

                            if (removingBeams.length > 0) {
                                // 集中荷重の平均値を更新
                                const forceList = Object.values(forceMap).flatMap((shapes) =>
                                    shapes.map((shape) => shape.data)
                                );
                                forceAverage = calcForceAverage(forceList);

                                // 分布荷重の平均値を更新
                                const trapezoidList = Object.values(trapezoidMap).flatMap(
                                    (shapes) => shapes.map((shape) => shape.data)
                                );
                                trapezoidAverage = calcTrapezoidAverage(trapezoidList);
                            }
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

                        // 全体の寸法線を更新する
                        recreateGlobalGuideLines(canvas, nodeMap, globalGuideLines);

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

                // 梁要素を選択したら寸法線を表示
                shape.beam.on('selected', (event: fabric.IEvent<Event>) => {
                    if (shape.guide) {
                        shape.guide.visible = true;
                    }
                });
                shape.beam.on('deselected', (event: fabric.IEvent<Event>) => {
                    if (shape.guide) {
                        shape.guide.visible = false;
                    }
                });

                // 梁要素のドラッグ
                shape.beam.on('moving', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select') {
                        if (typeof draggingBeam.current === 'undefined') {
                            // 寸法線、集中荷重、分布荷重を非表示とする
                            setVisibledToBeamParts(shape, forceMap, trapezoidMap, false);

                            // i端/j端の節点
                            const nodeI = nodeMap[shape.data.nodeI];
                            const nodeJ = nodeMap[shape.data.nodeJ];

                            // i端、j端の pin を非表示にする
                            if (nodeI.pin) {
                                nodeI.pin.visible = false;
                            }
                            if (nodeJ.pin) {
                                nodeJ.pin.visible = false;
                            }

                            // 以降の計算用に Vector で位置を保持
                            const vi = new Vector(nodeI.data.x, nodeI.data.y);
                            const vj = new Vector(nodeJ.data.x, nodeJ.data.y);
                            // i端/j端に接続する梁要素
                            const beamsI = nodeBeamMap[shape.data.nodeI];
                            const beamsJ = nodeBeamMap[shape.data.nodeJ];
                            const relationBeams = [...beamsI, ...beamsJ].filter((beamShape) => {
                                // ドラッグ中の梁要素とID が一致するものを除外
                                return beamShape.data.id !== shape.data.id;
                            });

                            const dragInfo: DraggingBeamInfo = {
                                target: shape,
                                nodeI,
                                nodeJ,
                                vi,
                                vj,
                                relationBeams,
                            };
                            draggingBeam.current = dragInfo;
                        }

                        // 位置を計算
                        const [ix, iy, jx, jy] = calcBeamPoints(
                            draggingBeam.current.target,
                            draggingBeam.current.vi,
                            draggingBeam.current.vj
                        );

                        // 節点の移動
                        updateNode(draggingBeam.current.nodeI, ix, iy, false);
                        updateNode(draggingBeam.current.nodeJ, jx, jy, false);

                        // 節点に紐づく梁要素の更新
                        draggingBeam.current.relationBeams.forEach((beamShape) => {
                            const points = beamShape.points;
                            if (draggingBeam.current) {
                                const { nodeI, nodeJ } = draggingBeam.current;
                                if (beamShape.data.nodeI === nodeI.data.id) {
                                    points[0] = ix;
                                    points[1] = iy;
                                }
                                if (beamShape.data.nodeI === nodeJ.data.id) {
                                    points[0] = jx;
                                    points[1] = jy;
                                }
                                if (beamShape.data.nodeJ === nodeI.data.id) {
                                    points[2] = ix;
                                    points[3] = iy;
                                }
                                if (beamShape.data.nodeJ === nodeJ.data.id) {
                                    points[2] = jx;
                                    points[3] = jy;
                                }
                                updateBeam(beamShape, points);
                            }
                        });
                    }
                }); // beam#moving

                shape.beam.on('moved', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select' && draggingBeam.current) {
                        const { target, vi, vj, nodeI, nodeJ } = draggingBeam.current;
                        // 位置を取得
                        const [ix, iy, jx, jy] = calcSnapedBeamPoints(target, vi, vj, snapSize);

                        // 梁要素の更新
                        updateBeam(target, [ix, iy, jx, jy]);
                        // 節点の更新
                        updateNode(nodeI, ix, iy);
                        updateNode(nodeJ, jx, jy);

                        // 置き換える節点 (key: 削除される節点ID、value: 置き換える節点)
                        const replaceNodes: Record<string, NodeShape> = {};
                        // 削除する梁要素
                        const removingBeams: string[] = [];
                        // 更新された梁要素
                        const modifiedBeams: string[] = [target.data.id];

                        // 節点IDを配列にしておく
                        const nodeIds = [nodeI.data.id, nodeJ.data.id];

                        // 絶対に大丈夫だけど念の為に空配列を準備しておく
                        nodeIds.forEach((nodeId) => {
                            if (typeof nodeBeamMap[nodeId] === 'undefined') {
                                nodeBeamMap[nodeId] = [];
                            }
                        });

                        // 梁要素をドラッグした結果、i端あるいはj端の節点が別の節点と同一座標になった場合
                        // - 同一座標の節点を取得、置換する
                        Object.values(nodeMap).forEach((nodeShape) => {
                            // ドラッグした梁要素の i端/j端 は対象外
                            if (nodeIds.includes(nodeShape.data.id)) {
                                return;
                            }
                            if (nodeShape.data.x === ix && nodeShape.data.y === iy) {
                                // i端の節点と置き換える
                                replaceNodes[nodeShape.data.id] = nodeI;
                            } else if (nodeShape.data.x === jx && nodeShape.data.y === jy) {
                                // j端の節点と置き換える
                                replaceNodes[nodeShape.data.id] = nodeJ;
                            }
                        });

                        Object.values(beamMap).forEach((beamShape) => {
                            // ドラッグした梁要素は除外
                            if (beamShape.data.id === target.data.id) {
                                return;
                            }

                            // i端あるいはj端の同一座標の節点を置き換える
                            let replacedI = false;
                            let replacedJ = false;
                            if (replaceNodes[beamShape.data.nodeI]) {
                                replacedI = true;
                                beamShape.data.nodeI = replaceNodes[beamShape.data.nodeI].data.id;
                            }
                            if (replaceNodes[beamShape.data.nodeJ]) {
                                replacedJ = true;
                                beamShape.data.nodeJ = replaceNodes[beamShape.data.nodeJ].data.id;
                            }

                            if (replacedI && replacedJ) {
                                // i端とj端の両方の節点を置換した
                                // → ドラッグした梁要素と同じ位置にある梁要素なので削除する
                                removingBeams.push(beamShape.data.id);
                                return;
                            }

                            const points = beamShape.points;
                            let modified = false;
                            // i端あるいはj端がドラッグした梁要素と一致する
                            // → 再描画する
                            if (beamShape.data.nodeI === nodeI.data.id) {
                                points[0] = ix;
                                points[1] = iy;
                                modified = true;
                            }
                            if (beamShape.data.nodeI === nodeJ.data.id) {
                                points[0] = jx;
                                points[1] = jy;
                                modified = true;
                            }
                            if (beamShape.data.nodeJ === nodeI.data.id) {
                                points[2] = ix;
                                points[3] = iy;
                                modified = true;
                            }
                            if (beamShape.data.nodeJ === nodeJ.data.id) {
                                points[2] = jx;
                                points[3] = jy;
                                modified = true;
                            }
                            if (modified) {
                                updateBeam(beamShape, points);

                                // 更新した結果、長さが 0 になった梁要素を削除する
                                if (beamShape.length === 0) {
                                    removingBeams.push(beamShape.data.id);
                                } else {
                                    // 更新対象としてマーク
                                    modifiedBeams.push(beamShape.data.id);
                                }
                            }
                        });

                        if (removingBeams.length > 0) {
                            // 梁要素の削除処理
                            removingBeams.forEach((beamId) => {
                                removeBeam(
                                    canvas,
                                    beamId,
                                    beamMap,
                                    nodeBeamMap,
                                    forceMap,
                                    trapezoidMap
                                );
                            });

                            // 集中荷重の平均値を更新
                            const forceList = Object.values(forceMap).flatMap((shapes) =>
                                shapes.map((shape) => shape.data)
                            );
                            forceAverage = calcForceAverage(forceList);

                            // 分布荷重の平均値を更新
                            const trapezoidList = Object.values(trapezoidMap).flatMap((shapes) =>
                                shapes.map((shape) => shape.data)
                            );
                            trapezoidAverage = calcTrapezoidAverage(trapezoidList);
                        }
                        // 節点の削除処理
                        Object.entries(replaceNodes).forEach(([removedNodeId, nodeShape]) => {
                            // nodeBeamMap の付け替え
                            const beams = nodeBeamMap[removedNodeId];
                            if (beams) {
                                const list = nodeBeamMap[nodeShape.data.id] ?? [];
                                beams.forEach((beamShape) => {
                                    if (list.some((beam) => beam.data.id !== beamShape.data.id)) {
                                        list.push(beamShape);
                                    }
                                });
                                nodeBeamMap[nodeShape.data.id] = list;
                            }

                            removeNode(canvas, removedNodeId, nodeMap, nodeBeamMap);
                        });

                        // 更新した梁要素について、集中荷重・分布荷重・寸法線を再生成する
                        modifiedBeams.forEach((beamId) => {
                            const beamShape = beamMap[beamId];
                            if (beamShape) {
                                // 集中荷重の更新
                                recreateForces(canvas, beamShape, forceMap, forceAverage);
                                // 分布荷重の更新
                                recreateTrapezoids(
                                    canvas,
                                    beamShape,
                                    trapezoidMap,
                                    trapezoidAverage
                                );
                                // 寸法線の更新
                                recreateBeamGuideLine(canvas, beamShape);
                            }
                        });

                        // 全体の寸法線を更新する
                        recreateGlobalGuideLines(canvas, nodeMap, globalGuideLines);

                        // ドラッグ終了
                        draggingBeam.current = undefined;
                    }
                }); // beam#moved

                // rotate
                shape.beam.on('rotating', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select') {
                        if (typeof draggingBeam.current === 'undefined') {
                            // 寸法線、集中荷重、分布荷重を非表示とする
                            setVisibledToBeamParts(shape, forceMap, trapezoidMap, false);

                            const nodeI = nodeMap[shape.data.nodeI];
                            // j端の pin を非表示にする
                            const nodeJ = nodeMap[shape.data.nodeJ];
                            if (nodeJ.pin) {
                                nodeJ.pin.visible = false;
                            }
                            // 以降の計算用に Vector で位置を保持
                            const vi = new Vector(nodeI.data.x, nodeI.data.y);
                            const vj = new Vector(nodeJ.data.x, nodeJ.data.y);
                            // j端に接続する梁要素
                            const beams = nodeBeamMap[shape.data.nodeJ];
                            const relationBeams = beams.filter((beamShape) => {
                                // ドラッグ中の梁要素とID が一致するものを除外
                                return beamShape.data.id !== shape.data.id;
                            });
                            relationBeams.forEach((beamShape) => {
                                // 寸法線、集中荷重、分布荷重を非表示とする
                                setVisibledToBeamParts(beamShape, forceMap, trapezoidMap, false);
                            });

                            const dragInfo: DraggingBeamInfo = {
                                target: shape,
                                nodeI,
                                nodeJ,
                                vi,
                                vj,
                                relationBeams,
                            };
                            draggingBeam.current = dragInfo;
                        }

                        // j端の位置を更新
                        draggingBeam.current.vj = draggingBeam.current.vi.clone().add(
                            vY
                                .clone()
                                .invert()
                                .multiplyScalar(shape.length)
                                .rotateDeg(shape.beam.angle ?? 0)
                        );
                        const [jx, jy] = [draggingBeam.current.vj.x, draggingBeam.current.vj.y];

                        updateNode(draggingBeam.current.nodeJ, jx, jy);

                        // 節点に紐づく梁要素の更新
                        draggingBeam.current.relationBeams.forEach((beamShape) => {
                            const points = beamShape.points;
                            if (draggingBeam.current) {
                                const { nodeJ } = draggingBeam.current;
                                if (beamShape.data.nodeI === nodeJ.data.id) {
                                    points[0] = jx;
                                    points[1] = jy;
                                }
                                if (beamShape.data.nodeJ === nodeJ.data.id) {
                                    points[2] = jx;
                                    points[3] = jy;
                                }
                                updateBeam(beamShape, points);
                            }
                        });
                    }
                }); // beam#rotating

                shape.beam.on('rotated', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select' && draggingBeam.current) {
                        const { target, vi, nodeJ } = draggingBeam.current;
                        // j端の位置を更新
                        const vj = vi.clone().add(
                            vY
                                .clone()
                                .invert()
                                .multiplyScalar(shape.length)
                                .rotateDeg(shape.beam.angle ?? 0)
                        );
                        // スナップする
                        // MEMO: スナップすると伸縮してしまうけど問題ない？
                        const [jx, jy] = snap([vj.x, vj.y], snapSize);
                        updateNode(nodeJ, jx, jy);

                        // 梁要素の更新
                        updateBeam(target, [vi.x, vi.y, jx, jy]);

                        // 置き換える節点 (key: 削除される節点ID、value: 置き換える節点)
                        const replaceNodes: Record<string, NodeShape> = {};
                        // 削除する梁要素
                        const removingBeams: string[] = [];
                        // 更新された梁要素
                        const modifiedBeams: string[] = [target.data.id];

                        const nodeId = nodeJ.data.id;
                        // 絶対に大丈夫だけど念の為に空配列を準備しておく
                        if (typeof nodeBeamMap[nodeId] === 'undefined') {
                            nodeBeamMap[nodeId] = [];
                        }

                        // 梁要素をドラッグした結果、j端の節点が別の節点と同一座標になった場合
                        // - 同一座標の節点を取得、置換する
                        Object.values(nodeMap).forEach((nodeShape) => {
                            // ドラッグした梁要素の i端/j端 は対象外
                            if (nodeId === nodeShape.data.id) {
                                return;
                            }
                            if (nodeShape.data.x === jx && nodeShape.data.y === jy) {
                                // j端の節点と置き換える
                                replaceNodes[nodeShape.data.id] = nodeJ;
                            }
                        });

                        Object.values(beamMap).forEach((beamShape) => {
                            // ドラッグした梁要素は除外
                            if (beamShape.data.id === target.data.id) {
                                return;
                            }

                            // i端あるいはj端の同一座標の節点を置き換える
                            let replacedI = false;
                            let replacedJ = false;
                            if (replaceNodes[beamShape.data.nodeI]) {
                                replacedI = true;
                                beamShape.data.nodeI = replaceNodes[beamShape.data.nodeI].data.id;
                            }
                            if (replaceNodes[beamShape.data.nodeJ]) {
                                replacedJ = true;
                                beamShape.data.nodeJ = replaceNodes[beamShape.data.nodeJ].data.id;
                            }

                            if (replacedI && replacedJ) {
                                // i端とj端の両方の節点を置換した
                                // → ドラッグした梁要素と同じ位置にある梁要素なので削除する
                                // NOTE: rotate ではありえない気がする
                                removingBeams.push(beamShape.data.id);
                                return;
                            }

                            const points = beamShape.points;
                            let modified = false;
                            // i端あるいはj端がドラッグした梁要素と一致する
                            // → 再描画する
                            if (beamShape.data.nodeI === nodeJ.data.id) {
                                points[0] = jx;
                                points[1] = jy;
                                modified = true;
                            }
                            if (beamShape.data.nodeJ === nodeJ.data.id) {
                                points[2] = jx;
                                points[3] = jy;
                                modified = true;
                            }
                            if (modified) {
                                updateBeam(beamShape, points);

                                // 更新した結果、長さが 0 になった梁要素を削除する
                                if (beamShape.length === 0) {
                                    removingBeams.push(beamShape.data.id);
                                } else {
                                    // 更新対象としてマーク
                                    modifiedBeams.push(beamShape.data.id);
                                }
                            }
                        });
                        if (removingBeams.length > 0) {
                            // 梁要素の削除処理
                            removingBeams.forEach((beamId) => {
                                removeBeam(
                                    canvas,
                                    beamId,
                                    beamMap,
                                    nodeBeamMap,
                                    forceMap,
                                    trapezoidMap
                                );
                            });

                            // 集中荷重の平均値を更新
                            const forceList = Object.values(forceMap).flatMap((shapes) =>
                                shapes.map((shape) => shape.data)
                            );
                            forceAverage = calcForceAverage(forceList);

                            // 分布荷重の平均値を更新
                            const trapezoidList = Object.values(trapezoidMap).flatMap((shapes) =>
                                shapes.map((shape) => shape.data)
                            );
                            trapezoidAverage = calcTrapezoidAverage(trapezoidList);
                        }
                        // 節点の削除処理
                        Object.entries(replaceNodes).forEach(([removedNodeId, nodeShape]) => {
                            // nodeBeamMap の付け替え
                            const beams = nodeBeamMap[removedNodeId];
                            if (beams) {
                                const list = nodeBeamMap[nodeShape.data.id] ?? [];
                                beams.forEach((beamShape) => {
                                    if (list.some((beam) => beam.data.id !== beamShape.data.id)) {
                                        list.push(beamShape);
                                    }
                                });
                                nodeBeamMap[nodeShape.data.id] = list;
                            }

                            removeNode(canvas, removedNodeId, nodeMap, nodeBeamMap);
                        });

                        // 更新した梁要素について、集中荷重・分布荷重・寸法線を再生成する
                        modifiedBeams.forEach((beamId) => {
                            const beamShape = beamMap[beamId];
                            if (beamShape) {
                                // 集中荷重の更新
                                recreateForces(canvas, beamShape, forceMap, forceAverage);
                                // 分布荷重の更新
                                recreateTrapezoids(
                                    canvas,
                                    beamShape,
                                    trapezoidMap,
                                    trapezoidAverage
                                );
                                // 寸法線の更新
                                recreateBeamGuideLine(canvas, beamShape);
                            }
                        });

                        // 全体の寸法線を更新する
                        recreateGlobalGuideLines(canvas, nodeMap, globalGuideLines);

                        // ドラッグ終了
                        draggingBeam.current = undefined;
                    }
                }); // beam#rotated

                shape.beam.on('scaling', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select') {
                        if (typeof draggingBeam.current === 'undefined') {
                            // 寸法線、集中荷重、分布荷重を非表示とする
                            setVisibledToBeamParts(shape, forceMap, trapezoidMap, false);

                            const nodeI = nodeMap[shape.data.nodeI];
                            // j端の pin を非表示にする
                            const nodeJ = nodeMap[shape.data.nodeJ];
                            if (nodeJ.pin) {
                                nodeJ.pin.visible = false;
                            }
                            // 以降の計算用に Vector で位置を保持
                            const vi = new Vector(nodeI.data.x, nodeI.data.y);
                            const vj = new Vector(nodeJ.data.x, nodeJ.data.y);
                            // j端に接続する梁要素
                            const beams = nodeBeamMap[shape.data.nodeJ];
                            const relationBeams = beams.filter((beamShape) => {
                                // ドラッグ中の梁要素とID が一致するものを除外
                                return beamShape.data.id !== shape.data.id;
                            });
                            relationBeams.forEach((beamShape) => {
                                // 寸法線、集中荷重、分布荷重を非表示とする
                                setVisibledToBeamParts(beamShape, forceMap, trapezoidMap, false);
                            });

                            const dragInfo: DraggingBeamInfo = {
                                target: shape,
                                nodeI,
                                nodeJ,
                                vi,
                                vj,
                                relationBeams,
                            };
                            draggingBeam.current = dragInfo;
                        }

                        // j端の位置を更新
                        const scale = shape.beam.scaleY ?? 1;
                        const angle = shape.beam.angle ?? 0;
                        const { vi, nodeJ } = draggingBeam.current;
                        const vj = vi.clone().add(
                            vY
                                .clone()
                                .invert()
                                .multiplyScalar(shape.length * scale)
                                .rotateDeg(angle)
                        );
                        draggingBeam.current.vj = vj;
                        updateNode(nodeJ, vj.x, vj.y);

                        // 節点に紐づく梁要素の更新
                        draggingBeam.current.relationBeams.forEach((beamShape) => {
                            const points = beamShape.points;
                            if (draggingBeam.current) {
                                if (beamShape.data.nodeI === nodeJ.data.id) {
                                    points[0] = vj.x;
                                    points[1] = vj.y;
                                }
                                if (beamShape.data.nodeJ === nodeJ.data.id) {
                                    points[2] = vj.x;
                                    points[3] = vj.y;
                                }
                                updateBeam(beamShape, points);
                            }
                        });
                    }
                }); // beam#scaling

                shape.beam.on('scaled', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select' && draggingBeam.current) {
                        const { target, vi, vj, nodeJ } = draggingBeam.current;

                        // スナップする
                        // MEMO: スナップすると角度が変わってしまうけど問題ない？
                        const [jx, jy] = snap([vj.x, vj.y], snapSize);
                        updateNode(nodeJ, jx, jy);

                        // 梁要素の更新
                        updateBeam(target, [vi.x, vi.y, jx, jy]);

                        // 置き換える節点 (key: 削除される節点ID、value: 置き換える節点)
                        const replaceNodes: Record<string, NodeShape> = {};
                        // 削除する梁要素
                        const removingBeams: string[] = [];
                        // 更新された梁要素
                        const modifiedBeams: string[] = [target.data.id];

                        const nodeId = nodeJ.data.id;
                        // 絶対に大丈夫だけど念の為に空配列を準備しておく
                        if (typeof nodeBeamMap[nodeId] === 'undefined') {
                            nodeBeamMap[nodeId] = [];
                        }

                        // 梁要素をドラッグした結果、j端の節点が別の節点と同一座標になった場合
                        // - 同一座標の節点を取得、置換する
                        Object.values(nodeMap).forEach((nodeShape) => {
                            // ドラッグした梁要素の i端/j端 は対象外
                            if (nodeId === nodeShape.data.id) {
                                return;
                            }
                            if (nodeShape.data.x === jx && nodeShape.data.y === jy) {
                                // j端の節点と置き換える
                                replaceNodes[nodeShape.data.id] = nodeJ;
                            }
                        });

                        Object.values(beamMap).forEach((beamShape) => {
                            // ドラッグした梁要素は除外
                            if (beamShape.data.id === target.data.id) {
                                return;
                            }

                            // i端あるいはj端の同一座標の節点を置き換える
                            let replacedI = false;
                            let replacedJ = false;
                            if (replaceNodes[beamShape.data.nodeI]) {
                                replacedI = true;
                                beamShape.data.nodeI = replaceNodes[beamShape.data.nodeI].data.id;
                            }
                            if (replaceNodes[beamShape.data.nodeJ]) {
                                replacedJ = true;
                                beamShape.data.nodeJ = replaceNodes[beamShape.data.nodeJ].data.id;
                            }

                            if (replacedI && replacedJ) {
                                // i端とj端の両方の節点を置換した
                                // → ドラッグした梁要素と同じ位置にある梁要素なので削除する
                                // NOTE: rotate ではありえない気がする
                                removingBeams.push(beamShape.data.id);
                                return;
                            }

                            const points = beamShape.points;
                            let modified = false;
                            // i端あるいはj端がドラッグした梁要素と一致する
                            // → 再描画する
                            if (beamShape.data.nodeI === nodeJ.data.id) {
                                points[0] = jx;
                                points[1] = jy;
                                modified = true;
                            }
                            if (beamShape.data.nodeJ === nodeJ.data.id) {
                                points[2] = jx;
                                points[3] = jy;
                                modified = true;
                            }
                            if (modified) {
                                updateBeam(beamShape, points);

                                // 更新した結果、長さが 0 になった梁要素を削除する
                                if (beamShape.length === 0) {
                                    removingBeams.push(beamShape.data.id);
                                } else {
                                    // 更新対象としてマーク
                                    modifiedBeams.push(beamShape.data.id);
                                }
                            }
                        });
                        if (removingBeams.length > 0) {
                            // 梁要素の削除処理
                            removingBeams.forEach((beamId) => {
                                removeBeam(
                                    canvas,
                                    beamId,
                                    beamMap,
                                    nodeBeamMap,
                                    forceMap,
                                    trapezoidMap
                                );
                            });

                            // 集中荷重の平均値を更新
                            const forceList = Object.values(forceMap).flatMap((shapes) =>
                                shapes.map((shape) => shape.data)
                            );
                            forceAverage = calcForceAverage(forceList);

                            // 分布荷重の平均値を更新
                            const trapezoidList = Object.values(trapezoidMap).flatMap((shapes) =>
                                shapes.map((shape) => shape.data)
                            );
                            trapezoidAverage = calcTrapezoidAverage(trapezoidList);
                        }
                        // 節点の削除処理
                        Object.entries(replaceNodes).forEach(([removedNodeId, nodeShape]) => {
                            // nodeBeamMap の付け替え
                            const beams = nodeBeamMap[removedNodeId];
                            if (beams) {
                                const list = nodeBeamMap[nodeShape.data.id] ?? [];
                                beams.forEach((beamShape) => {
                                    if (list.some((beam) => beam.data.id !== beamShape.data.id)) {
                                        list.push(beamShape);
                                    }
                                });
                                nodeBeamMap[nodeShape.data.id] = list;
                            }

                            removeNode(canvas, removedNodeId, nodeMap, nodeBeamMap);
                        });

                        // 更新した梁要素について、集中荷重・分布荷重・寸法線を再生成する
                        modifiedBeams.forEach((beamId) => {
                            const beamShape = beamMap[beamId];
                            if (beamShape) {
                                // 集中荷重の更新
                                recreateForces(canvas, beamShape, forceMap, forceAverage);
                                // 分布荷重の更新
                                recreateTrapezoids(
                                    canvas,
                                    beamShape,
                                    trapezoidMap,
                                    trapezoidAverage
                                );
                                // 寸法線の更新
                                recreateBeamGuideLine(canvas, beamShape);
                            }
                        });

                        // 全体の寸法線を更新する
                        recreateGlobalGuideLines(canvas, nodeMap, globalGuideLines);

                        // ドラッグ終了
                        draggingBeam.current = undefined;
                    }
                }); // beam#scaled

                // TODO: 梁要素の削除処理

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
                const shape = createForce(
                    force,
                    [nodeI.data.x, nodeI.data.y, nodeJ.data.x, nodeJ.data.y],
                    forceAverage,
                    readonly
                );

                /// TODO: 集中荷重のイベント
                // 集中荷重を選択したらラベルを表示
                shape.force.on('selected', () => {
                    shape.label.visible = true;
                });
                // 選択解除したらラベルを非表示
                shape.force.on('deselected', () => {
                    shape.label.visible = false;
                });

                // 集中荷重をダブルクリック/長押しすると集中荷重の設定ダイアログが表示される
                shape.force.on('mousedown', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select' && event.target) {
                        // すでに他で長押しイベントが実行されている場合は
                        // タイマーをキャンセル
                        if (longpressTimer.current) {
                            clearTimeout(longpressTimer.current);
                            longpressTimer.current = undefined;
                        }

                        const target = event.target;

                        // 長押し前の現在位置を保持する
                        const { top: beforeTop, left: beforeLeft } = target.getBoundingRect(
                            true,
                            true
                        );

                        // 長押しイベント
                        longpressTimer.current = setTimeout(() => {
                            // 長押し後の現在位置
                            const { top: afterTop, left: afterLeft } = target.getBoundingRect(
                                true,
                                true
                            );
                            // 位置が変わっていなければ longpress とする
                            if (beforeTop === afterTop && beforeLeft === afterLeft) {
                                // ダイアログの表示
                                openForceDialog(event, shape, (values: Force) => {
                                    // 平均値を再計算
                                    const forces = Object.values(forceMap).flatMap((forces) => {
                                        return forces.map(({ data }) => {
                                            if (data.id === values.id) {
                                                return values;
                                            }
                                            return data;
                                        });
                                    });
                                    forceAverage = calcForceAverage(forces);

                                    // 集中荷重の更新
                                    const beamShape = beamMap[values.beam];
                                    updateForce(canvas, values, shape, beamShape, forceAverage);
                                });
                            }
                            longpressTimer.current = undefined;
                        }, LongpressInterval);
                    }
                });
                shape.force.on('mouseup', (event: fabric.IEvent<Event>) => {
                    if (longpressTimer.current) {
                        clearTimeout(longpressTimer.current);
                        longpressTimer.current = undefined;
                    }
                });
                shape.force.on('mousedblclick', (event: fabric.IEvent<Event>) => {
                    if (toolRef.current === 'select') {
                        // ダイアログの表示
                        openForceDialog(event, shape, (values: Force) => {
                            // 平均値を再計算
                            const forces = Object.values(forceMap).flatMap((forces) => {
                                return forces.map(({ data }) => {
                                    if (data.id === values.id) {
                                        return values;
                                    }
                                    return data;
                                });
                            });
                            forceAverage = calcForceAverage(forces);

                            // 集中荷重の更新
                            const beamShape = beamMap[values.beam];
                            updateForce(canvas, values, shape, beamShape, forceAverage);
                        });
                    }
                });

                // 変更したら
                // - scale を保持して長さのみ変更
                // - ラベルを更新
                // 削除処理

                canvas.add(shape.force, shape.label);

                // 参照を保持する
                if (typeof forceMap[force.beam] === 'undefined') {
                    forceMap[force.beam] = [shape];
                } else {
                    forceMap[force.beam].push(shape);
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
            recreateGlobalGuideLines(canvas, nodeMap, globalGuideLines);

            fabricRef.current = canvas;
        }
    }, [
        data,
        gridSize,
        height,
        openForceDialog,
        openPinDialog,
        readonly,
        snapSize,
        viewport,
        width,
        zoom,
    ]);

    return <canvas ref={canvasRef} width={width} height={height} />;
};

export default forwardRef(CanvasCore);
