/**
 * ポインタの位置を返す
 * @param event
 * @returns
 */
export const getPointerPosition = (
    event: fabric.IEvent<Event>
): { clientX: number; clientY: number } => {
    if (event.e.type.indexOf('touch') === 0) {
        const { touches } = event.e as TouchEvent;
        const { clientX, clientY } = touches[0];
        return { clientX, clientY };
    } else {
        const { clientX, clientY } = event.e as MouseEvent;
        return { clientX, clientY };
    }
};
