import { AppBar, Toolbar, Typography } from '@mui/material';
import Version from './Version';

const Header: React.VFC = () => {
    return (
        <AppBar position="static">
            <Toolbar variant="dense">
                <Typography component="h1" variant="h6" color="inherit">
                    Drawing Sample
                </Typography>
                <Version />
            </Toolbar>
        </AppBar>
    );
};

export default Header;
