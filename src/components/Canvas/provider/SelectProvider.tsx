import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useState } from 'react';
import { Shape } from '../types';

interface ISelectContext {
    selected: Shape[];
    setSelected: Dispatch<SetStateAction<Shape[]>>;
    isSelected: (item: Shape) => boolean;
    select: (item: Shape) => void;
    toggle: (item: Shape) => void;
}

interface Props {
    children: ReactNode;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const SelectContext = createContext<ISelectContext>(undefined!);

/**
 * 要素選択 provider
 */
const SelectProvider: React.VFC<Props> = ({ children }) => {
    // 選択要素
    const [selected, setSelected] = useState<Shape[]>([]);

    const isSelected = useCallback(
        (item: Shape) => {
            return selected.some(({ type, id }) => type === item.type && id === item.id);
        },
        [selected]
    );

    const select = useCallback(
        (item: Shape) => {
            if (!isSelected(item)) {
                setSelected((state) => [...state, item]);
            }
        },
        [isSelected, setSelected]
    );

    const toggle = useCallback(
        (item: Shape) => {
            if (isSelected(item)) {
                // 削除
                setSelected((state) =>
                    state.filter(({ type, id }) => !(type === item.type && id === item.id))
                );
            } else {
                // 追加
                setSelected((state) => [...state, item]);
            }
        },
        [isSelected, setSelected]
    );

    return (
        <SelectContext.Provider
            value={{
                selected,
                setSelected,
                isSelected,
                select,
                toggle,
            }}
        >
            {children}
        </SelectContext.Provider>
    );
};

export default SelectProvider;
