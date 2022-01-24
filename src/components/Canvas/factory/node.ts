import { fabric } from 'fabric';
import { Node, NodePinType } from '../../../types/shape';

export type NodeShape = {
    node: fabric.Circle;
    pin?: fabric.Image;
};

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
const setProperties = (image: fabric.Image, node: Node) => {
    image.name = `image/${node.id}`;
    image.data = {
        ...node,
        type: 'node/pin',
    };
    image.top = node.y + NodeRadius;
    image.left = node.x - PinSize / 2;
    image.width = PinSize;
    image.height = PinSize;
    // イベントに反応させない
    image.selectable = false;
    image.evented = false;
    if (node.pin === 'pinZ') {
        image.setAngle(-90);
    }
};

/**
 * 節点ピンの作成
 * @param node
 * @param onLoadPin
 */
export const createNodePin = (node: Node, onLoadPin: (image: fabric.Image) => void): void => {
    if (node.pin && node.pin !== 'free') {
        fabric.Image.fromURL(Pins[node.pin], (image) => {
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
    onLoadPin: (image: fabric.Image) => void
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
    const shape: NodeShape = { node: circle };

    // 節点ピン
    createNodePin(node, onLoadPin);

    return shape;
};
