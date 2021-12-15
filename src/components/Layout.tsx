import { Box, Grid } from '@mui/material';
import { Structure } from '../types/shape';
import data from '../__test__/sample.json';
import Canvas from './Canvas';
import Header from './Header';
import ToolBox from './ToolBox';

const Layout: React.VFC = () => {
    return (
        <Box sx={{ width: '100vw', height: '100vh' }}>
            <Header />
            <Grid
                container
                sx={{
                    width: '100vw',
                    height: 'calc(100vh - 48px)',
                }}
            >
                <Grid item xs="auto">
                    <ToolBox />
                </Grid>
                <Grid item xs>
                    <Canvas structure={data as Structure} />
                </Grid>
            </Grid>
        </Box>
    );
};

export default Layout;
