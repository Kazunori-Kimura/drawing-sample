import { createContext, Dispatch, ReactNode, SetStateAction, useCallback, useState } from 'react';
import { Shape } from '../types';

interface Props {
    children: ReactNode;
}

interface ISelectContext {
    selected: Shape[];
    isSelected: (item: Shape) => boolean;
    select: (item: Shape) => void;
    toggle: (item: Shape) => void;
    setSelected: Dispatch<SetStateAction<Shape[]>>;
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const SelectContext = createContext<ISelectContext>(undefined!);

/**
 * 要素選択 provider
 * NOTE: 未使用、coreに組み込んでません
 */
const SelectProvider: React.VFC<Props> = ({ children }) => {
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
        [isSelected]
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
                console.log('add', item);
                setSelected((state) => [...state, item]);
            }
        },
        [isSelected]
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
