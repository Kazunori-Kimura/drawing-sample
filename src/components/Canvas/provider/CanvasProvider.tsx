import DrawProvider from './DrawProvider';
import PopupProvider from './PopupProvider';
import SelectProvider from './SelectProvider';
import StructureProvider, { StructureProviderProps } from './StructureProvider';

type Props = StructureProviderProps;

const CanvasProvider: React.VFC<Props> = ({ children, ...props }) => {
    return (
        <StructureProvider {...props}>
            <PopupProvider>
                <SelectProvider>
                    <DrawProvider>{children}</DrawProvider>
                </SelectProvider>
            </PopupProvider>
        </StructureProvider>
    );
};

export default CanvasProvider;
