import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Arrow, Text } from 'react-konva';
import { CanvasTool } from '../../../types/common';
import { Force as IForce } from '../../../types/shape';
import { PopupParams, PopupPosition } from '../popup/types';
import { PopupContext } from '../provider/PopupProvider';
import { SelectContext } from '../provider/SelectProvider';
import { StructureContext } from '../provider/StructureProvider';
import { ForceProps, Point } from '../types';
import { lerp, Vector, verticalNormalizeVector, vX } from '../util';

interface Props extends ForceProps {
    tool: CanvasTool;
    selected?: boolean;
    onDelete: VoidFunction;
    onSelect: VoidFunction;
    onEdit: (position: PopupPosition) => void;
}

const BaseLength = 30;

const Force: React.VFC<Props> = ({
    beam,
    distanceI,
    force,
    forceRatio,
    tool,
    selected = false,
    onDelete,
    onSelect,
    onEdit,
}) => {
    const [points, setPoints] = useState<number[]>([]);
    const [distance, setDistance] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [labelPosition, setLabelPosition] = useState<Point>([0, 0]);

    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    useEffect(() => {
        const { nodeI, nodeJ } = beam;

        // i端、j端
        viRef.current.x = nodeI.x;
        viRef.current.y = nodeI.y;
        vjRef.current.x = nodeJ.x;
        vjRef.current.y = nodeJ.y;
        // 矢印の先端
        const tail = lerp(viRef.current, vjRef.current, distanceI);
        // 梁に直交する単位ベクトル
        const vertical = verticalNormalizeVector(viRef.current, vjRef.current);
        // 矢印の開始点
        const arrowLength = BaseLength * forceRatio;
        const head = tail.clone().add(vertical.multiplyScalar(arrowLength));

        setPoints([head.x, head.y, tail.x, tail.y]);

        // ラベル描画用
        setDistance(Math.max(arrowLength, 140));
        const angle = vertical.clone().angleDeg();
        setRotation(angle);
        const dir = viRef.current.clone().subtract(vjRef.current).normalize();
        if (vX.dot(dir) < 0) {
            dir.invert();
        }
        const p = tail.clone().add(dir.multiplyScalar(6));
        setLabelPosition([p.x, p.y]);
    }, [beam, distanceI, forceRatio]);

    const handleClick = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
            if (tool === 'delete') {
                onDelete();
                // イベントの伝播を止める
                event.cancelBubble = true;
            } else if (tool === 'select') {
                onSelect();
                // イベントの伝播を止める
                event.cancelBubble = true;
            }
        },
        [onDelete, onSelect, tool]
    );

    const handleLabelClick = useCallback((event: KonvaEventObject<MouseEvent>) => {
        // ダブルクリック時にはクリックイベントも発生する
        // 何もバインドしていないと Stage のクリックイベント（選択解除）が発生するので
        // イベントの伝播を止めるだけのイベントハンドラを設定する
        event.cancelBubble = true;
    }, []);

    const handleLabelDoubleClick = useCallback(
        (event: KonvaEventObject<Event>) => {
            console.log(event);
            const point = event.target.getStage()?.getPointerPosition();
            if (point) {
                const { x, y } = point;
                // ポップアップを開く
                onEdit({ top: y, left: x });
            }
        },
        [onEdit]
    );

    const color = useMemo(() => {
        return selected ? 'red' : 'orange';
    }, [selected]);

    return (
        <>
            <Arrow
                points={points}
                pointerLength={6}
                pointerWidth={6}
                fill={color}
                stroke={color}
                strokeWidth={2}
                onClick={handleClick}
                onTap={handleClick}
            />
            {selected && (
                <Text
                    x={labelPosition[0]}
                    y={labelPosition[1]}
                    offsetX={-6}
                    text={`${force}kN`}
                    fontSize={12}
                    width={distance}
                    rotation={rotation}
                    fill={color}
                    wrap="none"
                    ellipsis
                    onClick={handleLabelClick}
                    onTap={handleLabelClick}
                    onDblClick={handleLabelDoubleClick}
                    onDblTap={handleLabelDoubleClick}
                />
            )}
        </>
    );
};

const ConnectedForce: React.VFC<ForceProps> = (props) => {
    const { tool, deleteForce } = useContext(StructureContext);
    const { isSelected, toggle } = useContext(SelectContext);
    const { open } = useContext(PopupContext);

    const handleDelete = useCallback(() => {
        deleteForce(props.id);
    }, [deleteForce, props.id]);

    const handleSelect = useCallback(() => {
        toggle({ type: 'forces', id: props.id });
    }, [props.id, toggle]);

    const handleEdit = useCallback(
        (position: PopupPosition) => {
            const force: IForce = {
                ...props,
                beam: props.beam.id,
            };
            // ポップアップを表示
            open('forces', position, force as unknown as PopupParams);
        },
        [open, props]
    );

    return (
        <Force
            {...props}
            tool={tool}
            selected={isSelected({ type: 'forces', id: props.id })}
            onDelete={handleDelete}
            onSelect={handleSelect}
            onEdit={handleEdit}
        />
    );
};

export default ConnectedForce;
