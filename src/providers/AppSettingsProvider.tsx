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
import { AppMode, DOMSize, ShapeBaseProps } from '../types/common';
import {
    defaultCanvasProps,
    DrawingProps,
    PageSize,
    PageSizeType,
    StructureCanvasProps,
} from '../types/note';

interface Props {
    children: React.ReactNode;
}

interface IAppSettingsContext {
    mode: AppMode;
    onChangeMode: Dispatch<SetStateAction<AppMode>>;
    pageSizeType: PageSizeType;
    pageSize: DOMSize;
    onChangePageSize: Dispatch<SetStateAction<PageSizeType>>;
    structures: StructureCanvasProps[];
    onChangeStructures: Dispatch<SetStateAction<StructureCanvasProps[]>>;
    drawings: DrawingProps[];
    addDrawing: (drawing: DrawingProps) => void;
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
    // ノートのサイズ
    const [pageSizeType, setPageSizeType] = useState<PageSizeType>('default');
    // ページに含まれる構造データ
    const [structures, setStructures] = useState<StructureCanvasProps[]>([defaultCanvasProps]);
    // ノートの描画データ
    const [drawings, setDrawings] = useState<DrawingProps[]>([]);

    const [selectedCanvasIndex, setCanvasIndex] = useState<number>();
    const [canvasProps, setCanvasProps] = useState<ShapeBaseProps>();
    const canvasRef = useRef<CanvasHandler>(null);

    /**
     * キャンバスの編集開始
     */
    const editCanvas = useCallback((props: ShapeBaseProps) => {
        setMode('canvas');
        setCanvasProps(props);
    }, []);

    /**
     * キャンバスの編集完了
     */
    const closeCanvas = useCallback(() => {
        if (canvasRef.current) {
            // 更新した構造データを取得する
            const structure = canvasRef.current.getStructure();
            const image = canvasRef.current.toDataURL();

            // 選択中のキャンバスのデータを更新
            if (typeof selectedCanvasIndex === 'number') {
                setStructures((state) => {
                    const data = clone(state);
                    data[selectedCanvasIndex].data = structure.data;
                    data[selectedCanvasIndex].zoom = structure.zoom;
                    data[selectedCanvasIndex].viewport = structure.viewport;
                    data[selectedCanvasIndex].image = image;
                    return data;
                });
            }
        }

        // 状態をリセット
        setMode('note');
        setCanvasProps(undefined);
    }, [selectedCanvasIndex]);

    /**
     * 線の追加
     */
    const addDrawing = useCallback((drawing: DrawingProps) => {
        setDrawings((data) => [...data, drawing]);
    }, []);

    return (
        <AppSettingsContext.Provider
            value={{
                mode,
                onChangeMode: setMode,
                pageSizeType,
                pageSize: PageSize[pageSizeType],
                onChangePageSize: setPageSizeType,
                structures,
                onChangeStructures: setStructures,
                drawings,
                addDrawing,
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
