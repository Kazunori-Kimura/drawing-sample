import { KonvaEventObject } from 'konva/lib/Node';
import { useCallback, useContext, useMemo } from 'react';
import { Arrow } from 'react-konva';
import Vector from 'victor';
import { StructureContext } from '../provider/StructureProvider';
import { ForceProps } from '../types';
import { lerp, verticalNormalizeVector } from '../util';

type Props = ForceProps;

const BaseLength = 30;

const Force: React.VFC<Props> = ({ id: force, beam, distanceI, forceRatio }) => {
    const { deleteForce, tool } = useContext(StructureContext);

    const points = useMemo(() => {
        const { nodeI, nodeJ } = beam;

        // i端、j端
        const vi = new Vector(nodeI.x, nodeI.y);
        const vj = new Vector(nodeJ.x, nodeJ.y);
        // 矢印のお尻
        const tail = lerp(vi, vj, distanceI);
        // 梁に直交する単位ベクトル
        const vertical = verticalNormalizeVector(vi, vj);
        // 矢印の頭
        const head = tail.clone().add(vertical.multiplyScalar(BaseLength * forceRatio));

        return [head.x, head.y, tail.x, tail.y];
    }, [beam, distanceI, forceRatio]);

    const handleClick = useCallback(
        (event: KonvaEventObject<MouseEvent>) => {
            if (tool === 'delete') {
                deleteForce(force);
                // イベントの伝播を止める
                event.cancelBubble = true;
            }
        },
        [deleteForce, force, tool]
    );

    return (
        <Arrow
            points={points}
            pointerLength={6}
            pointerWidth={6}
            fill="orange"
            stroke="orange"
            strokeWidth={2}
            onClick={handleClick}
            onTap={handleClick}
        />
    );
};

export default Force;
