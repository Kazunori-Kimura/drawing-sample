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
import { NoteHandler } from '../components/Note';
import { AppMode } from '../types/common';
import { CommitStructureFunction, PageSizeType, StructureCanvasState } from '../types/note';
import { debug } from '../utils/logger';

interface Props {
    children: React.ReactNode;
}

interface IAppSettingsContext {
    mode: AppMode;
    onChangeMode: Dispatch<SetStateAction<AppMode>>;
    pageSizeType: PageSizeType;
    onChangePageSize: Dispatch<SetStateAction<PageSizeType>>;
    canvasProps?: StructureCanvasState;
    editCanvas: (props: StructureCanvasState, callback: CommitStructureFunction) => void;
    closeCanvas: VoidFunction;
    noteRef: RefObject<NoteHandler>;
    canvasRef: RefObject<CanvasHandler>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const AppSettingsContext = createContext<IAppSettingsContext>(undefined!);

const AppSettingsProvider: React.VFC<Props> = ({ children }) => {
    // アプリのモード (note | canvas)
    const [mode, setMode] = useState<AppMode>('note');
    // ノートのサイズ
    const [pageSizeType, setPageSizeType] = useState<PageSizeType>('A4');
    // キャンバスの描画情報
    const [canvasProps, setCanvasProps] = useState<StructureCanvasState>();
    // ノートの参照
    const noteRef = useRef<NoteHandler>(null);
    // キャンバスの参照
    const canvasRef = useRef<CanvasHandler>(null);
    // ノートへのコールバック関数
    const callbackRef = useRef<CommitStructureFunction>();

    /**
     * キャンバスの編集開始
     */
    const editCanvas = useCallback(
        (props: StructureCanvasState, callback: CommitStructureFunction) => {
            setMode('canvas');
            const state = clone(props);
            state.zoom = state.zoom * state.pageZoom;
            setCanvasProps(state);
            callbackRef.current = callback;
        },
        []
    );

    /**
     * キャンバスの編集完了
     */
    const closeCanvas = useCallback(() => {
        if (canvasRef.current) {
            // 更新した構造データを取得する
            const structure = canvasRef.current.getStructure();
            debug('- canvas closed: ', structure);

            // 選択中のキャンバスのデータを更新
            if (callbackRef.current) {
                callbackRef.current(structure);
            }
        }

        // 状態をリセット
        setMode('note');
        setCanvasProps(undefined);
    }, []);

    return (
        <AppSettingsContext.Provider
            value={{
                mode,
                onChangeMode: setMode,
                pageSizeType,
                onChangePageSize: setPageSizeType,
                canvasProps,
                editCanvas,
                closeCanvas,
                noteRef,
                canvasRef,
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
};

export default AppSettingsProvider;
