import { Stage } from 'react-konva';
import { DOMSize } from '../../types/common';
import { Structure } from '../../types/shape';
import ShapeLayer from './layer/ShapeLayer';
import StructureProvider from './provider/StructureProvider';

interface Props {
    structure: Structure;
    size: DOMSize;
    onChange?: (structure: Structure) => void;
}

const CanvasCore: React.VFC<Props> = ({ structure, size, onChange }) => {
    return (
        <Stage width={size.width} height={size.height}>
            <StructureProvider structure={structure} onChange={onChange}>
                <ShapeLayer />
            </StructureProvider>
        </Stage>
    );
};

export default CanvasCore;
