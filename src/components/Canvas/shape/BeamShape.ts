import { fabric } from 'fabric';
import { v4 as uuid } from 'uuid';
import { ForceShape, NodeShape } from '.';
import { Beam, Force, isBeam } from '../../../types/shape';
import { createBeamGuideLine } from '../factory';
import CanvasManager from '../manager';
import { BeamPoints } from '../types';
import { round, snap, Vector, vY } from '../util';

export class BeamShape {
    public data: Beam;
    public beam: fabric.Line;
    public guide?: fabric.Group;

    public points: BeamPoints = [0, 0, 0, 0];
    public direction: Vector = new Vector(0, 0);
    public length = 1;
    public angle = 0;

    private manager: CanvasManager;
    private dragging = false;
    private _readonly = false;

    private vi = new Vector(0, 0);
    private vj = new Vector(0, 0);

    // ドラッグ中に関連する節点、梁要素の Shape を保持する
    // メモリリークを避けるため、ドラッグ完了後にクリアすること
    private nodeI: NodeShape | undefined;
    private nodeJ: NodeShape | undefined;
    private relationBeams: BeamShape[] | undefined;

    constructor(manager: CanvasManager, params: Beam) {
        this.manager = manager;
        this.data = params;

        const nodeI = this.manager.nodeMap[params.nodeI];
        const nodeJ = this.manager.nodeMap[params.nodeJ];
        this._readonly = this.manager.readonly;

        // 梁要素
        this.beam = this.create([nodeI.data.x, nodeI.data.y, nodeJ.data.x, nodeJ.data.y], params, {
            // readonly時はイベントに反応しない
            selectable: !this.readonly,
            evented: !this.readonly,
        });

        // 寸法線
        this.guide = createBeamGuideLine(this.points);
        this.guide.visible = false;

        // キャンバスに追加
        this.manager.canvas.add(this.beam, this.guide);

        // イベント設定
        this.attachEvents();
    }

    public get readonly(): boolean {
        return this._readonly;
    }
    public set readonly(value: boolean) {
        this._readonly = value;
        // readonly時はイベントに反応しない
        this.beam.selectable = !value;
        this.beam.evented = !value;
    }

    private createBeamByVectors(
        vi: Vector,
        vj: Vector,
        data: Beam,
        options: fabric.ILineOptions
    ): fabric.Line {
        // 方向
        this.direction = vj.clone().subtract(vi).normalize();
        // 長さ
        this.length = vi.distance(vj);
        // 角度 (Vector では Y軸が上方向なので 上下反転させる)
        this.angle = 180 - this.direction.verticalAngleDeg();

        const beam = new fabric.Line([0, 0, 0, this.length], {
            top: vi.y,
            left: vi.x,
            angle: this.angle,
            // 始点を基準に回転させる
            originX: 'center',
            originY: 'bottom',
            centeredRotation: false,
            // 描画設定
            stroke: 'black',
            strokeWidth: 4,
            ...options,
            name: data.id,
            data: {
                type: 'beam',
                ...data,
            },
        });
        beam.setControlsVisibility({
            bl: false,
            br: false,
            mb: false,
            ml: false,
            mr: false,
            mt: true,
            tl: false,
            tr: false,
            mtr: true,
        });

        this.points = [vi.x, vi.y, vj.x, vj.y];
        this.vi = vi;
        this.vj = vj;

        return beam;
    }

    createBeamByPoints(points: BeamPoints, data: Beam, options: fabric.ILineOptions): fabric.Line {
        const p1 = new Vector(points[0], points[1]);
        const p2 = new Vector(points[2], points[3]);
        return this.createBeamByVectors(p1, p2, data, options);
    }

    create(points: BeamPoints, data: Beam, options?: fabric.ILineOptions): fabric.Line;
    create(vi: Vector, vj: Vector, data: Beam, options?: fabric.ILineOptions): fabric.Line;

    create(
        arg1: BeamPoints | Vector,
        arg2: Vector | Beam,
        arg3?: Beam | fabric.ILineOptions,
        arg4?: fabric.ILineOptions
    ): fabric.Line {
        if (Array.isArray(arg1) && isBeam(arg2)) {
            return this.createBeamByPoints(arg1, arg2, arg3 ?? {});
        } else if (isBeam(arg3)) {
            return this.createBeamByVectors(arg1 as Vector, arg2 as Vector, arg3, arg4 ?? {});
        }
        throw new Error('invalid parameters');
    }

    /**
     * 寸法線を更新
     */
    private updateGuide() {
        if (this.guide) {
            this.manager.canvas.remove(this.guide);
        }
        this.guide = createBeamGuideLine(this.points);
        this.guide.visible = false;
        this.manager.canvas.add(this.guide);
    }

    private updateBeamByVectors(vi: Vector, vj: Vector): void {
        // 方向
        const direction = vj.clone().subtract(vi).normalize();
        // 長さ
        const length = vi.distance(vj);
        // 角度 (Vector では Y軸が上方向なので 上下反転させる)
        const angle = 180 - direction.verticalAngleDeg();

        const points: BeamPoints = [vi.x, vi.y, vj.x, vj.y];

        this.beam.scaleX = 1;
        this.beam.scaleY = 1;
        // dirty=true を指定していないと、一定の長さ以下の梁要素が描画できない
        this.beam.dirty = true;
        this.beam.top = vi.y;
        this.beam.left = vi.x;
        this.beam.height = length;
        this.beam.rotate(angle);

        // プロパティを更新
        this.direction = direction;
        this.length = length;
        this.angle = angle;
        this.points = points;
        this.vi = vi;
        this.vj = vj;

        // 寸法線を更新
        this.updateGuide();
    }

    private updateBeamByPoints(points: BeamPoints): void {
        const p1 = new Vector(points[0], points[1]);
        const p2 = new Vector(points[2], points[3]);
        this.updateBeamByVectors(p1, p2);
    }

    update(): void;
    update(points: BeamPoints): void;
    update(vi: Vector, vj: Vector): void;

    public update(arg1?: BeamPoints | Vector, arg2?: Vector): void {
        if (Array.isArray(arg1)) {
            this.updateBeamByPoints(arg1);
            return;
        } else if (arg1 && arg2) {
            this.updateBeamByVectors(arg1, arg2);
            return;
        } else {
            this.updateBeamByPoints(this.points);
        }

        throw new Error('invalid parameters');
    }

    /**
     * 梁要素を削除する
     * (NOTE: removeBeam 後、集中荷重と分布荷重の平均値を更新すること)
     */
    public remove(): void {
        const { canvas, forceMap, trapezoidMap, beamMap, nodeBeamMap } = this.manager;
        const beamId = this.data.id;

        // 集中荷重を削除
        const forces = forceMap[beamId];
        if (forces) {
            forces.forEach((shape) => {
                shape.remove();
            });
            delete forceMap[beamId];
        }
        // 分布荷重を削除
        const trapezoids = trapezoidMap[beamId];
        if (trapezoids) {
            trapezoids.forEach((shape) => {
                shape.remove();
            });
            delete trapezoidMap[beamId];
        }

        // nodeBeamMap から梁要素を削除
        [this.data.nodeI, this.data.nodeJ].forEach((nodeId) => {
            const beams = nodeBeamMap[nodeId];
            if (beams) {
                // 削除対象の梁要素を除外
                const list = beams.filter((shape) => shape.data.id !== beamId);
                nodeBeamMap[nodeId] = list;
            }
        });

        // 梁要素を削除
        canvas.remove(this.beam);
        if (this.guide) {
            canvas.remove(this.guide);
        }
        delete beamMap[beamId];
    }

    /**
     * 寸法線、集中荷重、分布荷重の表示・非表示を切り替える
     * @param visible
     */
    public setVisibleParts(visible = true): void {
        const { forceMap, trapezoidMap } = this.manager;
        if (this.guide) {
            this.guide.visible = visible;
        }

        // 集中荷重
        const forces = forceMap[this.data.id];
        if (forces) {
            forces.forEach((shape) => {
                shape.visible = visible;
            });
        }

        // 分布荷重
        const trapezoids = trapezoidMap[this.data.id];
        if (trapezoids) {
            trapezoids.forEach((shape) => {
                shape.visible = visible;
            });
        }
    }

    /**
     * 寸法線、集中荷重、分布荷重 を更新する
     */
    public updateParts(): void {
        const { forceMap, trapezoidMap } = this.manager;
        // 寸法線の更新
        this.updateGuide();
        // 集中荷重
        const forces = forceMap[this.data.id];
        if (forces) {
            forces.forEach((shape) => {
                shape.update();
            });
        }
        // 分布荷重
        const trapezoids = trapezoidMap[this.data.id];
        if (trapezoids) {
            trapezoids.forEach((shape) => {
                shape.update();
            });
        }
    }

    /**
     * i端の位置と長さ、角度からj端の位置を計算する
     * @returns
     */
    private calcPoints(snapping = false): BeamPoints {
        // i端の位置
        let { top: iy = 0, left: ix = 0 } = this.beam;

        if (snapping) {
            [ix, iy] = snap([ix, iy], this.manager.snapSize);
        }

        this.vi.x = ix;
        this.vi.y = iy;
        // j端の位置を計算
        this.vj.copy(this.vi);
        this.vj.add(this.direction.clone().multiplyScalar(this.length));

        return [this.vi.x, this.vi.y, this.vj.x, this.vj.y];
    }

    /**
     * 指定座標を元に i端からの距離比を計算
     * @param point
     * @returns
     */
    public calcRatio(point: Vector): number {
        // i端からクリック位置までの距離
        const distance = this.vi.distance(point);
        // i端からクリック位置の方向
        const dir = point.clone().subtract(this.vi).normalize();
        // クリック方向の角度
        const angle = 180 - dir.verticalAngleDeg();
        // クリック方向と梁要素のなす角度
        const deg = this.angle - angle;
        // ラジアンに変換
        const rad = deg * (Math.PI / 180);
        // 梁要素上の長さ
        const length = distance * Math.cos(rad);
        // 比率に変換
        let ratio = round(length / this.length, 2);

        // 0 〜 1 の範囲に修正
        if (ratio < 0) {
            ratio = 0;
        }
        if (ratio > 1) {
            ratio = 1;
        }

        return ratio;
    }

    /**
     * ドラッグ終了時の共通処理
     */
    private completeDrag() {
        if (this.nodeI && this.nodeJ) {
            const nodeI = this.nodeI;
            const nodeJ = this.nodeJ;
            const { nodeMap, nodeBeamMap, beamMap } = this.manager;
            const [ix, iy, jx, jy] = this.points;

            // 置き換える節点 (key: 削除される節点ID、value: 置き換える節点)
            const replaceNodes: Record<string, NodeShape> = {};
            // 削除する梁要素
            const removingBeams: BeamShape[] = [];
            // 更新された梁要素
            const modifiedBeams: BeamShape[] = [this];

            // 節点IDを配列にしておく
            const nodeIds = [nodeI.data.id, nodeJ.data.id];

            // 絶対に大丈夫だけど念の為に空配列を準備しておく
            nodeIds.forEach((nodeId) => {
                if (typeof nodeBeamMap[nodeId] === 'undefined') {
                    nodeBeamMap[nodeId] = [];
                }
            });

            // 梁要素をドラッグした結果、i端あるいはj端の節点が
            // 別の節点と同一座標になった場合、同一座標の節点をドラッグ中の節点に置換する
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

            // 梁要素の節点を置換する
            Object.values(beamMap).forEach((beamShape) => {
                // ドラッグした梁要素は除外
                if (beamShape.data.id === this.data.id) {
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
                    removingBeams.push(beamShape);
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
                    beamShape.update(points);

                    // 更新した結果、長さが 0 になった梁要素を削除する
                    if (beamShape.length === 0) {
                        removingBeams.push(beamShape);
                    } else {
                        // 更新対象としてマーク
                        modifiedBeams.push(beamShape);
                    }
                }
            }); // end 梁要素の節点を置換

            if (removingBeams.length > 0) {
                // 梁要素の削除処理
                removingBeams.forEach((beam) => {
                    beam.remove();
                });

                // 集中荷重の平均値を更新
                this.manager.calcForceAverage();
                // 分布荷重の平均値を更新
                this.manager.calcTrapezoidAverage();
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

                const node = nodeMap[removedNodeId];
                if (node) {
                    node.remove();
                }
            });

            // 更新した梁要素について、集中荷重・分布荷重・寸法線を再生成する
            modifiedBeams.forEach((beam) => {
                beam.updateParts();
            });

            // 全体の寸法線を更新する
            this.manager.updateGlobalGuidelines();
        }
        // ドラッグ終了
        this.nodeI = undefined;
        this.nodeJ = undefined;
        this.relationBeams = undefined;
        this.dragging = false;
    } // end onDragEnd

    // イベントハンドラ
    private attachEvents() {
        // 選択
        this.beam.on('selected', this.onSelect.bind(this));
        this.beam.on('deselected', this.onDeselect.bind(this));
        // クリック
        this.beam.on('mousedown', this.onMouseDown.bind(this));
        this.beam.on('mousedown:before', this.onMouseDownBefore.bind(this));
        // ドラッグ
        this.beam.on('moving', this.onMoving.bind(this));
        this.beam.on('moved', this.onMoved.bind(this));
        // 回転
        this.beam.on('rotating', this.onRotating.bind(this));
        this.beam.on('rotated', this.onRotated.bind(this));
        // 伸縮
        this.beam.on('scaling', this.onScaling.bind(this));
        this.beam.on('scaled', this.onScaled.bind(this));
    }

    private onSelect(event: fabric.IEvent<Event>): void {
        if (this.guide) {
            this.guide.visible = true;
        }
    }
    private onDeselect(event: fabric.IEvent<Event>): void {
        if (this.guide) {
            this.guide.visible = false;
        }
    }

    /**
     * 分布荷重追加モード時、梁要素のクリック前に描画可能にする
     */
    private onMouseDownBefore(): void {
        if (this.manager.tool === 'trapezoid') {
            // 分布荷重の描画開始
            this.manager.currentBeam = this.data.id;
            this.manager.canvas.isDrawingMode = true;
        }
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        if (event.absolutePointer) {
            // クリック位置
            const point = new Vector(event.absolutePointer.x, event.absolutePointer.y);
            if (this.manager.tool === 'force') {
                // クリックした位置に集中荷重を追加する
                // i端からの距離 (比率)
                const ratio = this.calcRatio(point);

                // 集中荷重を作成
                const forceId = uuid();
                const force: Force = {
                    id: forceId,
                    name: forceId,
                    beam: this.data.id,
                    force: 10, // 初期値固定
                    distanceI: ratio,
                };
                const shape = new ForceShape(this.manager, force);
                if (typeof this.manager.forceMap[this.data.id] === 'undefined') {
                    this.manager.forceMap[this.data.id] = [];
                }
                this.manager.forceMap[this.data.id].push(shape);

                // 集中荷重の平均値を更新
                this.manager.calcForceAverage();
            } else if (this.manager.tool === 'delete') {
                // 梁要素を削除
                this.remove();
                // 梁要素に紐付かない節点を削除
                this.manager.removeUnconnectedNodes();
                // 寸法線を更新
                this.manager.updateGlobalGuidelines();
                // 集中荷重、分布荷重の平均値を再計算
                this.manager.calcForceAverage();
                this.manager.calcTrapezoidAverage();
            }
        }
    }

    /**
     * 梁要素のドラッグ
     * @param event
     */
    private onMoving(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select') {
            if (!this.dragging) {
                // 寸法線・集中荷重・分布荷重を非表示とする
                this.setVisibleParts(false);

                this.nodeI = this.manager.nodeMap[this.data.nodeI];
                this.nodeJ = this.manager.nodeMap[this.data.nodeJ];
                this.relationBeams = [];

                const nodes = [this.nodeI, this.nodeJ];
                nodes.forEach((node) => {
                    // i端、j端の pin を非表示にする
                    if (node && node.pin) {
                        node.pin.visible = false;
                    }

                    // i端/j端に接続する梁要素
                    const beams = this.manager.nodeBeamMap[node.data.id];
                    beams.forEach((beam) => {
                        if (beam.data.id !== this.data.id) {
                            // 寸法線・集中荷重・分布荷重を非表示とする
                            beam.setVisibleParts(false);
                            this.relationBeams?.push(beam);
                        }
                    });
                });
            }

            // 位置を計算
            const [ix, iy, jx, jy] = this.calcPoints();

            if (this.nodeI && this.nodeJ) {
                // 節点を移動
                this.nodeI.update(ix, iy, false);
                this.nodeJ.update(jx, jy, false);

                // 節点に紐づく梁要素を更新
                this.relationBeams?.forEach((beamShape) => {
                    const points = beamShape.points;
                    if (beamShape.data.nodeI === this.nodeI?.data.id) {
                        points[0] = ix;
                        points[1] = iy;
                    }
                    if (beamShape.data.nodeI === this.nodeJ?.data.id) {
                        points[0] = jx;
                        points[1] = jy;
                    }
                    if (beamShape.data.nodeJ === this.nodeI?.data.id) {
                        points[2] = ix;
                        points[3] = iy;
                    }
                    if (beamShape.data.nodeJ === this.nodeJ?.data.id) {
                        points[2] = jx;
                        points[3] = jy;
                    }
                    beamShape.update(points);
                });
            }

            this.dragging = true;
        }
    } // onMoving

    private onMoved(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select' && this.dragging && this.nodeI && this.nodeJ) {
            // 位置を取得
            const [ix, iy, jx, jy] = this.calcPoints(true);

            // 梁要素を更新
            this.update([ix, iy, jx, jy]);
            // 節点の更新
            this.nodeI?.update(ix, iy);
            this.nodeJ?.update(jx, jy);

            // ドラッグ完了
            this.completeDrag();
        }
    } // end onMoved

    /**
     * rotate もドラッグの一形態とみなす
     * @param event
     */
    private onRotating(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select') {
            if (!this.dragging) {
                // 寸法線・集中荷重・分布荷重を非表示とする
                this.setVisibleParts(false);

                this.nodeI = this.manager.nodeMap[this.data.nodeI];
                this.nodeJ = this.manager.nodeMap[this.data.nodeJ];
                this.relationBeams = [];

                // j端の pin を非表示にする
                if (this.nodeJ.pin) {
                    this.nodeJ.pin.visible = false;
                }

                // j端に接続する梁要素
                const beams = this.manager.nodeBeamMap[this.nodeJ.data.id];
                beams.forEach((beam) => {
                    if (beam.data.id !== this.data.id) {
                        // 寸法線・集中荷重・分布荷重を非表示とする
                        beam.setVisibleParts(false);
                        this.relationBeams?.push(beam);
                    }
                });
            }

            // j端の位置を取得
            this.vj.copy(this.vi);
            this.vj.add(
                vY
                    .clone()
                    .invert()
                    .multiplyScalar(this.length)
                    .rotateDeg(this.beam.angle ?? 0)
            );
            const [jx, jy] = [this.vj.x, this.vj.y];
            this.nodeJ?.update(jx, jy);

            // 節点に紐づく梁要素の更新
            this.relationBeams?.forEach((beamShape) => {
                const points = beamShape.points;
                if (beamShape.data.nodeI === this.nodeJ?.data.id) {
                    points[0] = jx;
                    points[1] = jy;
                }
                if (beamShape.data.nodeJ === this.nodeJ?.data.id) {
                    points[2] = jx;
                    points[3] = jy;
                }
                beamShape.update(points);
            });

            this.dragging = true;
        }
    } // end onRotating

    private onRotated(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select' && this.dragging) {
            // j端の位置を取得
            this.vj.copy(this.vi);
            this.vj.add(
                vY
                    .clone()
                    .invert()
                    .multiplyScalar(this.length)
                    .rotateDeg(this.beam.angle ?? 0)
            );
            const [jx, jy] = snap([this.vj.x, this.vj.y], this.manager.snapSize);
            // j端の更新
            this.vj.x = jx;
            this.vj.y = jy;
            this.nodeJ?.update(jx, jy);

            // 梁要素の更新
            this.update([this.vi.x, this.vi.y, jx, jy]);

            // ドラッグ完了
            this.completeDrag();
        }
    } // end onRotated

    private onScaling(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select') {
            if (!this.dragging) {
                // 寸法線・集中荷重・分布荷重を非表示とする
                this.setVisibleParts(false);

                this.nodeI = this.manager.nodeMap[this.data.nodeI];
                this.nodeJ = this.manager.nodeMap[this.data.nodeJ];
                this.relationBeams = [];

                // j端の pin を非表示にする
                if (this.nodeJ.pin) {
                    this.nodeJ.pin.visible = false;
                }

                // j端に接続する梁要素
                const beams = this.manager.nodeBeamMap[this.nodeJ.data.id];
                beams.forEach((beam) => {
                    if (beam.data.id !== this.data.id) {
                        // 寸法線・集中荷重・分布荷重を非表示とする
                        beam.setVisibleParts(false);
                        this.relationBeams?.push(beam);
                    }
                });
            }

            // j端の位置を更新
            const scale = this.beam.scaleY ?? 1;
            const angle = this.beam.angle ?? 0;
            this.vj.copy(this.vi);
            this.vj.add(
                vY
                    .clone()
                    .invert()
                    .multiplyScalar(this.length * scale)
                    .rotateDeg(angle)
            );
            const [jx, jy] = [this.vj.x, this.vj.y];
            this.nodeJ?.update(jx, jy);

            // 節点に紐づく梁要素の更新
            this.relationBeams?.forEach((beamShape) => {
                const points = beamShape.points;
                if (beamShape.data.nodeI === this.nodeJ?.data.id) {
                    points[0] = jx;
                    points[1] = jy;
                }
                if (beamShape.data.nodeJ === this.nodeJ?.data.id) {
                    points[2] = jx;
                    points[3] = jy;
                }
                beamShape.update(points);
            });

            this.dragging = true;
        }
    } // end onScaling

    private onScaled(event: fabric.IEvent<Event>): void {
        if (this.manager.tool === 'select' && this.dragging) {
            // j端の位置を取得
            const scale = this.beam.scaleY ?? 1;
            const angle = this.beam.angle ?? 0;
            this.vj.copy(this.vi);
            this.vj.add(
                vY
                    .clone()
                    .invert()
                    .multiplyScalar(this.length * scale)
                    .rotateDeg(angle)
            );
            const [jx, jy] = snap([this.vj.x, this.vj.y], this.manager.snapSize);
            // j端の更新
            this.vj.x = jx;
            this.vj.y = jy;
            this.nodeJ?.update(jx, jy);

            // 梁要素の更新
            this.update([this.vi.x, this.vi.y, jx, jy]);

            // ドラッグ完了
            this.completeDrag();
        }
    }
}
