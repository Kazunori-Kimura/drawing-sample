import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Box, IconButton, Menu, MenuItem, styled } from '@mui/material';
import { MouseEvent, useCallback, useState } from 'react';
import { AppMode } from '../../../types/common';
import { StructureCanvasProps } from '../../../types/note';

interface Props extends StructureCanvasProps {
    top: number;
    left: number;
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
    top,
    left,
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

    return (
        <Box
            sx={{
                position: 'absolute',
                top,
                left,
                width,
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
        </Box>
    );
};

export default CanvasNavigation;
