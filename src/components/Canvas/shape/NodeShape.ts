import { fabric } from 'fabric';
import { isNode, Node, NodePinType } from '../../../types/shape';
import CanvasManager from '../manager';
import { compareCoords, snap } from '../util';
import { BeamShape } from './BeamShape';

const Pins: Readonly<Record<NodePinType, string>> = {
    free: '/assets/images/pins/pin_1.svg', // とりあえずダミーで指定
    pin: '/assets/images/pins/pin_1.svg',
    pinX: '/assets/images/pins/pin_2.svg',
    pinZ: '/assets/images/pins/pin_2.svg',
    fixX: '/assets/images/pins/pin_3.svg',
    fix: '/assets/images/pins/pin_4.svg',
};
const PinSize = 24;
const NodeRadius = 5;

export class NodeShape {
    public data: Node;
    public node: fabric.Circle;
    public pin: fabric.Object | undefined;

    private manager: CanvasManager;
    private longpressTimer: NodeJS.Timer | undefined;
    private dragging = false;
    private _readonly = false;

    constructor(manager: CanvasManager, params: Node) {
        this.manager = manager;
        this.data = params;

        this.node = this.createNode(params);
        // キャンバスに追加
        this.manager.canvas.add(this.node);
        // pin読み込み
        this.loadPin();

        this.attachEvents();
    }

    public update(): void;
    public update(x: number, y: number, visiblePin?: boolean): void;
    public update(params: Node, visiblePin?: boolean): void;

    public update(arg1?: number | Node, arg2?: number | boolean, arg3?: boolean): void {
        if (typeof arg1 === 'number' && typeof arg2 === 'number') {
            this.updatePosition(arg1, arg2, arg3);
            return;
        } else if (isNode(arg1) && typeof arg2 !== 'number') {
            this.updateByParams(arg1, arg2);
            return;
        } else if (typeof arg1 === 'undefined') {
            const { x, y } = this.data;
            this.updatePosition(x, y, true);
        }
        throw new Error('invalid parameters');
    }

    private updatePosition(x: number, y: number, visiblePin = true): void {
        const params: Node = {
            ...this.data,
            x,
            y,
        };
        this.updateByParams(params, visiblePin);
    }

    private updateByParams(params: Node, visiblePin = true): void {
        const { x, y, pin } = params;
        this.data = params;
        this.node.top = y;
        this.node.left = x;
        this.node.data = {
            ...params,
            type: 'node',
        };

        if (pin) {
            if (this.pin && this.pin.data.pin === pin) {
                // pin の変更なし、位置のみ更新する
                if (pin === 'pinZ') {
                    this.pin.top = y + NodeRadius;
                    this.pin.left = x;
                } else {
                    this.pin.top = y;
                    this.pin.left = x + NodeRadius;
                }
                this.pin.visible = visiblePin;
            } else {
                // pin の再読み込み
                this.loadPin(visiblePin);
            }
        }
    }

    public remove(): void {
        this.manager.canvas.remove(this.node);
        if (this.pin) {
            this.manager.canvas.remove(this.pin);
        }

        const beams = this.manager.nodeBeamMap[this.data.id];
        if (beams) {
            beams.forEach((beam) => {
                beam.remove();
            });
        }

        delete this.manager.nodeMap[this.data.id];
        delete this.manager.nodeBeamMap[this.data.id];
    }

    public get readonly(): boolean {
        return this._readonly;
    }
    public set readonly(value: boolean) {
        this._readonly = value;
        // readonly時はイベントに反応しない
        this.node.selectable = !value;
        this.node.evented = !value;
    }

    private createNode(params: Node): fabric.Circle {
        return new fabric.Circle({
            name: params.id,
            data: {
                type: 'node',
                ...params,
            },
            top: params.y,
            left: params.x,
            radius: NodeRadius,
            fill: 'black',
            originX: 'center',
            originY: 'center',
            // 選択してもコントロールを表示しない
            hasBorders: false,
            hasControls: false,
            // readonly時はイベントに反応しない
            selectable: !this.manager.readonly,
            evented: !this.manager.readonly,
        });
    }

    private setPinProperties(params: Node) {
        if (this.pin) {
            this.pin.name = `image/${params.id}`;
            this.pin.data = {
                ...params,
                type: 'node/pin',
            };
            this.pin.originX = 'center';
            this.pin.originY = 'top';
            this.pin.centeredRotation = false;
            this.pin.top = params.y + NodeRadius;
            this.pin.left = params.x;
            this.pin.scale(PinSize / 160);
            // イベントに反応させない
            this.pin.selectable = false;
            this.pin.evented = false;
            if (params.pin === 'pinZ') {
                this.pin.top = params.y;
                this.pin.left = params.x + NodeRadius;
                this.pin.rotate(-90);
            }
        }
    }

    private loadPin(visiblePin = true): void {
        const pinType = this.data.pin;

        // 表示中の pin をクリア
        if (this.pin) {
            this.manager.canvas.remove(this.pin);
            this.pin = undefined;
        }

        if (typeof pinType === 'undefined' || pinType === 'free') {
            // pin を表示しない
            return;
        }

        fabric.loadSVGFromURL(`${process.env.PUBLIC_URL}${Pins[pinType]}`, (objects, options) => {
            this.pin = fabric.util.groupSVGElements(objects, options);
            // プロパティ設定
            this.setPinProperties(this.data);
            // 表示する
            this.pin.visible = visiblePin;
            this.manager.canvas.add(this.pin);
        });
    }

    // イベントハンドラ
    private attachEvents() {
        this.node.on('mousedown', this.onMouseDown.bind(this));
        this.node.on('mouseup', this.onMouseUp.bind(this));
        this.node.on('mousedblclick', this.onDblClick.bind(this));
        this.node.on('moving', this.onMoving.bind(this));
        this.node.on('moved', this.onMoved.bind(this));
    }

    private onMouseDown(event: fabric.IEvent<Event>): void {
        if (this.readonly) {
            // 読み取り専用時は何もしない
            return;
        }

        if (this.manager.tool === 'delete') {
            this.remove();
            // 梁要素に紐付かない節点を削除
            this.manager.removeUnconnectedNodes();
            // 寸法線を更新
            this.manager.updateGlobalGuidelines();
            // 集中荷重の平均値を再計算
            this.manager.calcForceAverage();
            // 分布荷重の平均値を再計算
            this.manager.calcTrapezoidAverage();
            return;
        }

        // すでに長押しを実行中ならタイマーキャンセル
        if (this.longpressTimer) {
            clearTimeout(this.longpressTimer);
            this.longpressTimer = undefined;
        }

        if (this.manager.tool === 'select') {
            const shape = this.node;
            // 長押し前の現在位置を保持する
            const { top: beforeTop, left: beforeLeft } = shape.getBoundingRect(true, true);

            // 長押し判定
            this.longpressTimer = setTimeout(() => {
                // 長押し後の現在位置
                const { top: afterTop, left: afterLeft } = shape.getBoundingRect(true, true);
                // 位置が変わっていなければ longpress とする
                if (compareCoords([beforeLeft, beforeTop], [afterLeft, afterTop])) {
                    // ダイアログの表示
                    this.manager.openNodeDialog(event, this);
                }
                this.longpressTimer = undefined;
            }, CanvasManager.LongpressInterval);
        }
    }

    private onMouseUp(event: fabric.IEvent<Event>): void {
        if (this.longpressTimer) {
            clearTimeout(this.longpressTimer);
            this.longpressTimer = undefined;
        }
    }
    private onDblClick(event: fabric.IEvent<Event>): void {
        if (!this.readonly) {
            // ダイアログの表示
            this.manager.openNodeDialog(event, this);
        }
    }

    /**
     * ドラッグで節点の移動
     * 梁要素（とそれに紐づく集中荷重、分布荷重）を追従して更新する
     * @param event
     */
    private onMoving(event: fabric.IEvent<Event>): void {
        if (!this.readonly && event.pointer) {
            // ドラッグされた位置
            const { x, y } = event.pointer;

            const { nodeMap, nodeBeamMap } = this.manager;

            if (!this.dragging) {
                // ドラッグ開始
                if (this.pin) {
                    // pin を非表示
                    this.pin.visible = false;
                }
            }

            // この節点に紐づく梁要素
            const beams = nodeBeamMap[this.data.id];
            if (beams) {
                beams.forEach((beamShape) => {
                    // 梁要素の再描画
                    const ni = nodeMap[beamShape.data.nodeI];
                    const nj = nodeMap[beamShape.data.nodeJ];
                    let [ix, iy, jx, jy] = [ni.data.x, ni.data.y, nj.data.x, nj.data.y];
                    if (beamShape.data.nodeI === this.data.id) {
                        // i端の移動
                        ix = x;
                        iy = y;
                    } else if (beamShape.data.nodeJ === this.data.id) {
                        jx = x;
                        jy = y;
                    }

                    beamShape.update([ix, iy, jx, jy]);

                    if (!this.dragging) {
                        // 梁要素の集中荷重、分布荷重を非表示とする
                        beamShape.setVisibleParts(false);
                    }
                });
            }

            this.dragging = true;
        }
    } // onMoving

    /**
     * ドラッグ終了
     * @param event
     */
    private onMoved(event: fabric.IEvent<Event>): void {
        if (!this.readonly && event.target) {
            // 現在位置をスナップ
            const { x, y } = event.target.getCenterPoint();
            const [sx, sy] = snap([x, y], this.manager.snapSize);

            // 節点の更新
            this.update(sx, sy);

            const { nodeBeamMap, nodeMap } = this.manager;
            // この節点に紐づく梁要素
            const beams = nodeBeamMap[this.data.id];
            if (beams) {
                // 削除対象の梁要素
                const removingBeams: BeamShape[] = [];

                beams.forEach((beamShape) => {
                    const ni = nodeMap[beamShape.data.nodeI];
                    const nj = nodeMap[beamShape.data.nodeJ];
                    const [ix, iy, jx, jy] = [ni.data.x, ni.data.y, nj.data.x, nj.data.y];

                    // 長さが 0 となった梁要素を削除するようマーク
                    if (ix === jx && iy === jy) {
                        removingBeams.push(beamShape);
                        return;
                    }

                    // 梁要素の再描画
                    beamShape.update([ix, iy, jx, jy]);
                    // 集中荷重、分布荷重、寸法線を更新
                    beamShape.updateParts();
                });

                if (removingBeams.length > 0) {
                    // 長さ 0 となった梁要素を削除
                    removingBeams.forEach((beam) => {
                        beam.remove();
                    });
                    // 梁要素を削除したら集中荷重、分布荷重の平均値を更新
                    this.manager.calcForceAverage();
                    this.manager.calcTrapezoidAverage();
                }
            }

            // 同一座標の節点が存在する場合にドラッグした節点とマージする
            if (typeof this.manager.nodeBeamMap[this.data.id] === 'undefined') {
                // 絶対に大丈夫だけど念の為に空配列を準備しておく
                this.manager.nodeBeamMap[this.data.id] = [];
            }

            Object.values(this.manager.nodeMap).forEach((ns) => {
                // この節点と同一座標の節点について
                if (ns.data.id !== this.data.id && ns.data.x === sx && ns.data.y === sy) {
                    // canvas から節点を除去
                    this.manager.canvas.remove(ns.node);
                    if (ns.pin) {
                        this.manager.canvas.remove(ns.pin);
                    }

                    // 同一座標の節点に紐づく梁要素
                    const beams = this.manager.nodeBeamMap[ns.data.id];
                    if (beams) {
                        beams.forEach((beamShape) => {
                            // 節点を付け替え
                            if (beamShape.data.nodeI === ns.data.id) {
                                beamShape.data.nodeI = this.data.id;
                            }
                            if (beamShape.data.nodeJ === ns.data.id) {
                                beamShape.data.nodeJ = this.data.id;
                            }
                            beamShape.beam.data = {
                                type: 'beam',
                                ...beamShape.data,
                            };

                            // マージされた節点に参照を移動する
                            this.manager.nodeBeamMap[this.data.id].push(beamShape);
                        });
                    }

                    // 節点を削除
                    ns.remove();
                }
            });

            // 全体の寸法線を更新する
            this.manager.updateGlobalGuidelines();

            // ドラッグ終了
            this.dragging = false;
        }
    } // onMoved
}
