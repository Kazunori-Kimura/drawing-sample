import { KonvaEventObject } from 'konva/lib/Node';
import { Vector2d } from 'konva/lib/types';
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Line } from 'react-konva';
import { CanvasTool } from '../../../types/common';
import { SelectContext } from '../provider/SelectProvider';
import { StructureContext } from '../provider/StructureProvider';
import { BeamProps } from '../types';
import { createForceParams, Vector } from '../util';

interface Props extends BeamProps {
    tool: CanvasTool;
    selected?: boolean;
    addForce: (point: Vector2d, vi: Vector, vj: Vector) => void;
    onDelete: VoidFunction;
    onSelect: VoidFunction;
}

const Beam: React.VFC<Props> = ({
    nodeI,
    nodeJ,
    tool,
    selected = false,
    addForce,
    onDelete,
    onSelect,
}) => {
    const [points, setPoints] = useState<number[]>([]);
    const viRef = useRef<Vector>(new Vector(0, 0));
    const vjRef = useRef<Vector>(new Vector(0, 0));

    /**
     * beam をクリック
     * - 該当位置に集中荷重を追加する
     * - 該当要素を削除
     */
    const handleClick = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
            // 集中荷重の追加モードの場合
            if (tool === 'force') {
                // クリック位置
                const point = event.target.getStage()?.getPointerPosition();
                if (point) {
                    addForce(point, viRef.current, vjRef.current);
                    // イベントの伝播を止める
                    event.cancelBubble = true;
                }
            } else if (tool === 'delete') {
                // 梁要素の削除
                onDelete();
                // イベントの伝播を止める
                event.cancelBubble = true;
            } else if (tool === 'select') {
                // 梁要素の選択
                onSelect();
                // イベントの伝播を止める
                event.cancelBubble = true;
            }
        },
        [addForce, onDelete, onSelect, tool]
    );

    useEffect(() => {
        setPoints([nodeI.x, nodeI.y, nodeJ.x, nodeJ.y]);
        viRef.current.x = nodeI.x;
        viRef.current.y = nodeI.y;
        vjRef.current.x = nodeJ.x;
        vjRef.current.y = nodeJ.y;
    }, [nodeI.x, nodeI.y, nodeJ.x, nodeJ.y]);

    return (
        <Line
            points={points}
            stroke={selected ? 'blue' : 'black'}
            strokeWidth={4}
            onClick={handleClick}
            onTap={handleClick}
        />
    );
};

const ConnectedBeam: React.VFC<BeamProps> = (props) => {
    const { tool, addForce, deleteBeam } = useContext(StructureContext);
    const { selected, toggle } = useContext(SelectContext);

    const handleAddForce = useCallback(
        (point: Vector2d, vi: Vector, vj: Vector) => {
            const vp = new Vector(point.x, point.y);
            const force = createForceParams(props.id, vi, vj, vp);
            addForce(force);
        },
        [addForce, props.id]
    );

    const handleDelete = useCallback(() => {
        deleteBeam(props.id);
    }, [deleteBeam, props.id]);

    const handleSelect = useCallback(() => {
        toggle({ type: 'beams', id: props.id });
    }, [props.id, toggle]);

    const isSelected = useMemo(() => {
        return selected.some((shape) => shape.type === 'beams' && shape.id === props.id);
    }, [props.id, selected]);

    return (
        <Beam
            {...props}
            tool={tool}
            selected={isSelected}
            addForce={handleAddForce}
            onDelete={handleDelete}
            onSelect={handleSelect}
        />
    );
};

export default ConnectedBeam;
