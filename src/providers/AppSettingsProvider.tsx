import {
    createContext,
    Dispatch,
    RefObject,
    SetStateAction,
    useCallback,
    useRef,
    useState,
} from 'react';
import { CanvasHandler } from '../components/Canvas';
import { clone } from '../components/Canvas/util';
import { AppMode, ShapeBaseProps } from '../types/common';
import { defaultPageProps, PageProps } from '../types/note';

interface Props {
    children: React.ReactNode;
}

interface IAppSettingsContext {
    mode: AppMode;
    onChangeMode: Dispatch<SetStateAction<AppMode>>;
    page: PageProps;
    onChange: Dispatch<SetStateAction<PageProps>>;
    selectedCanvasIndex?: number;
    onSelectCanvas: Dispatch<SetStateAction<number | undefined>>;
    canvasProps?: ShapeBaseProps;
    editCanvas: (props: ShapeBaseProps) => void;
    closeCanvas: VoidFunction;
    canvasRef: RefObject<CanvasHandler>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const AppSettingsContext = createContext<IAppSettingsContext>(undefined!);

const AppSettingsProvider: React.VFC<Props> = ({ children }) => {
    const [mode, setMode] = useState<AppMode>('note');
    const [page, setPage] = useState<PageProps>(defaultPageProps);
    const [selectedCanvasIndex, setCanvasIndex] = useState<number>();
    const [canvasProps, setCanvasProps] = useState<ShapeBaseProps>();
    const canvasRef = useRef<CanvasHandler>(null);

    const editCanvas = useCallback((props: ShapeBaseProps) => {
        setMode('canvas');
        setCanvasProps(props);
    }, []);

    const closeCanvas = useCallback(() => {
        if (canvasRef.current) {
            // 更新した構造データを取得する
            const structure = canvasRef.current.getStructure();
            const image = canvasRef.current.toDataURL();

            // 選択中のキャンバスのデータを更新
            if (typeof selectedCanvasIndex === 'number') {
                setPage((state) => {
                    const data = clone(state);
                    data.structures[selectedCanvasIndex].data = structure;
                    data.structures[selectedCanvasIndex].image = image;
                    return data;
                });
            }
        }

        // 状態をリセット
        setMode('note');
        setCanvasProps(undefined);
    }, [selectedCanvasIndex]);

    return (
        <AppSettingsContext.Provider
            value={{
                mode,
                onChangeMode: setMode,
                page,
                onChange: setPage,
                selectedCanvasIndex,
                onSelectCanvas: setCanvasIndex,
                canvasProps,
                editCanvas,
                closeCanvas,
                canvasRef,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
};

export default AppSettingsProvider;
