import { fabric } from 'fabric';
import { isNode, Node, NodePinType } from '../../../types/shape';

export type NodeShape = {
    data: Node;
    node: fabric.Circle;
    pin?: fabric.Object;
};

type LoadPinCallback = (pin: fabric.Object) => void;

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

/**
 * 節点ピンのプロパティ設定
 * @param image
 * @param node
 */
const setProperties = (image: fabric.Object, node: Node) => {
    image.name = `image/${node.id}`;
    image.data = {
        ...node,
        type: 'node/pin',
    };
    image.originX = 'center';
    image.originY = 'top';
    image.centeredRotation = false;
    image.top = node.y + NodeRadius;
    image.left = node.x;
    image.scale(PinSize / 160);
    // イベントに反応させない
    image.selectable = false;
    image.evented = false;
    if (node.pin === 'pinZ') {
        image.top = node.y;
        image.left = node.x + NodeRadius;
        image.rotate(-90);
    }
};

/**
 * 節点ピンの作成
 * @param node
 * @param onLoadPin
 */
export const createNodePin = (node: Node, onLoadPin: LoadPinCallback): void => {
    if (node.pin && node.pin !== 'free') {
        fabric.loadSVGFromURL(`${process.env.PUBLIC_URL}${Pins[node.pin]}`, (objects, options) => {
            const image = fabric.util.groupSVGElements(objects, options);
            // プロパティ設定
            setProperties(image, node);
            // 読み込んだ画像を callback に渡す
            onLoadPin(image);
        });
    }
};

/**
 * 節点の作成
 * @param node
 * @param options
 * @param onLoadPin
 * @returns
 */
export const createNode = (
    node: Node,
    options: fabric.ICircleOptions,
    onLoadPin: LoadPinCallback
): NodeShape => {
    // 節点本体
    const circle = new fabric.Circle({
        name: node.id,
        data: {
            type: 'node',
            ...node,
        },
        top: node.y,
        left: node.x,
        radius: NodeRadius,
        fill: 'black',
        originX: 'center',
        originY: 'center',
        // 選択してもコントロールを表示しない
        hasBorders: false,
        hasControls: false,
        ...options,
    });
    const shape: NodeShape = { data: node, node: circle };

    // 節点ピン
    createNodePin(node, onLoadPin);

    return shape;
};

export const updateNode = (shape: NodeShape, x: number, y: number, visiblePin = true): void => {
    shape.data.x = x;
    shape.data.y = y;
    shape.node.top = y;
    shape.node.left = x;

    const data = shape.node.data;
    if (isNode(data)) {
        shape.node.data = {
            ...data,
            x,
            y,
        };
    }

    if (shape.pin) {
        if (shape.data.pin !== 'pinZ') {
            shape.pin.top = y + NodeRadius;
            shape.pin.left = x;
        } else {
            shape.pin.top = y;
            shape.pin.left = x + NodeRadius;
        }
        shape.pin.visible = visiblePin;
    }
};
