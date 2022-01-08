import EditIcon from '@mui/icons-material/Edit';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { IconButton, Menu, MenuItem, styled } from '@mui/material';
import { MouseEvent, useCallback, useState } from 'react';
import { Html } from 'react-konva-utils';

interface Props {
    x: number;
    y: number;
    width: number;
    height: number;
    onEdit?: VoidFunction;
    onCopy?: VoidFunction;
    onDelete?: VoidFunction;
}

const Background = styled('div')({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '0 8',
    //background:
    //    'linear-gradient(180deg, rgba(204,204,204,1) 0%, rgba(204,204,204,0.8) 70%, rgba(0,0,0,0) 100%)',
});
const Spacer = styled('div')({
    flex: 1,
});

const HeaderMenu: React.VFC<Props> = ({ y: top, x: left, width, onEdit, onCopy, onDelete }) => {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);

    const handleClickMore = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);
    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
    }, []);

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
                <IconButton size="small" onClick={onEdit}>
                    <EditIcon />
                </IconButton>
                <Spacer />
                <IconButton size="small" onClick={handleClickMore}>
                    <MoreVertIcon />
                </IconButton>
            </Background>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
                <MenuItem onClick={onCopy}>コピー</MenuItem>
                <MenuItem onClick={onDelete}>削除</MenuItem>
            </Menu>
        </Html>
    );
};

export default HeaderMenu;
