import { Box, Grid } from '@mui/material';
import Canvas from './Canvas';
import Header from './Header';
import ToolBox from './ToolBox';

const Layout: React.VFC = () => {
    return (
        <Box sx={{ width: '100vw', height: '100vh' }}>
            <Header />
            <Grid
                container
                sx={(theme) => ({
                    width: '100vw',
                    height: 'calc(100vh - 48px)',
                })}
            >
                <Grid item xs="auto">
                    <ToolBox />
                </Grid>
                <Grid item xs>
                    <Canvas />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Layout;
