import { createContext, Dispatch, SetStateAction, useCallback, useState } from 'react';
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
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const AppSettingsContext = createContext<IAppSettingsContext>(undefined!);

const AppSettingsProvider: React.VFC<Props> = ({ children }) => {
    const [mode, setMode] = useState<AppMode>('note');
    const [page, setPage] = useState<PageProps>(defaultPageProps);
    const [selectedCanvasIndex, setCanvasIndex] = useState<number>();
    const [canvasProps, setCanvasProps] = useState<ShapeBaseProps>();

    const editCanvas = useCallback((props: ShapeBaseProps) => {
        setMode('canvas');
        setCanvasProps(props);
    }, []);

    const closeCanvas = useCallback(() => {
        setMode('note');
        setCanvasProps(undefined);
    }, []);

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
            }}
        >
            {children}
        </AppSettingsContext.Provider>
    );
};

export default AppSettingsProvider;
