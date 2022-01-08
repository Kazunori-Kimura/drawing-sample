import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu, MenuItem, styled } from '@mui/material';
import { MouseEvent, useCallback, useState } from 'react';
import { Html } from 'react-konva-utils';
import { AppMode } from '../../../../types/common';

interface Props {
    visible?: boolean;
    mode: AppMode;
    x: number;
    y: number;
    width: number;
    height: number;
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

const HeaderMenu: React.VFC<Props> = ({
    visible = false,
    mode,
    y: top,
    x: left,
    width,
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

    if (!visible) {
        return null;
    }

    return (
        <Html
            divProps={{
                style: {
                    top: `${top}px`,
                    left: `${left}px`,
                    width: `${width}px`,
                },
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
                <MenuItem onClick={onCopy}>コピー</MenuItem>
                <MenuItem onClick={onDelete}>削除</MenuItem>
            </Menu>
        </Html>
    );
};

export default HeaderMenu;
