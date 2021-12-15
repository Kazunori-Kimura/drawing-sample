import { Stage } from 'react-konva';
import { DOMSize } from '../../types/common';
import { Structure } from '../../types/shape';
import { useDraw } from './hook/draw';
import DrawLayer from './layer/DrawLayer';
import ShapeLayer from './layer/ShapeLayer';
import StructureProvider from './provider/StructureProvider';

interface Props {
    structure: Structure;
    size: DOMSize;
    readonly?: boolean;
    onChange?: (structure: Structure) => void;
}

const CanvasCore: React.VFC<Props> = ({ structure, size, readonly = false, onChange }) => {
    const { points, ...handlers } = useDraw({ disabled: readonly, structure, onChange });

    return (
        <Stage width={size.width} height={size.height} {...handlers}>
            <StructureProvider structure={structure} onChange={onChange}>
                <ShapeLayer />
                <DrawLayer points={points} />
            </StructureProvider>
        </Stage>
    );
};

export default CanvasCore;
