import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, Menu, MenuItem, styled } from '@mui/material';
import { MouseEvent, useCallback, useMemo, useState } from 'react';
import { AppMode } from '../../../types/common';
import { StructureCanvasState } from '../../../types/note';

interface Props extends StructureCanvasState {
    mode: AppMode;
    onEdit?: VoidFunction;
    onCopy?: VoidFunction;
    onDelete?: VoidFunction;
    onCancel?: VoidFunction;
}

const Background = styled('div')({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0 8',
});
const Spacer = styled('div')({
    flex: 1,
});

const CanvasNavigation: React.VFC<Props> = ({
    mode,
    coordinates,
    width,
    pageZoom,
    onEdit,
    onCopy,
    onDelete,
    onCancel,
}) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClickMore = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleCopy = useCallback(() => {
        onCopy && onCopy();
        // メニューを閉じる
        setAnchorEl(null);
    }, [onCopy]);

    const handleDelete = useCallback(() => {
        onDelete && onDelete();
        // メニューを閉じる
        setAnchorEl(null);
    }, [onDelete]);

    const [top, left] = useMemo(() => {
        let top = coordinates.tl.y - 34; // 34 はナビゲーションの高さ
        const left = coordinates.tl.x;

        if (top < 0) {
            // ナビゲーションがキャンバスをはみ出す場合は
            // 下側にナビゲーションを出す
            top = coordinates.bl.y;
        }

        return [top, left];
    }, [coordinates.bl.y, coordinates.tl.x, coordinates.tl.y]);

    return (
        <Box
            sx={{
                position: 'absolute',
                top,
                left,
                width: width * pageZoom,
            }}
        >
            <Background>
                {mode === 'canvas' && (
                    <IconButton size="small" onClick={onCancel}>
                        <CloseIcon />
                    </IconButton>
                )}
                {mode === 'note' && (
                    <>
                        <IconButton size="small" onClick={onEdit}>
                            <EditIcon />
                        </IconButton>
                        <Spacer />
                        <IconButton size="small" onClick={handleClickMore}>
                            <MoreVertIcon />
                        </IconButton>
                    </>
                )}
            </Background>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                <MenuItem onClick={handleCopy}>コピー</MenuItem>
                <MenuItem onClick={handleDelete}>削除</MenuItem>
            </Menu>
        </Box>
    );
};

export default CanvasNavigation;
