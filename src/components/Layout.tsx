import { Box } from '@mui/material';
import CanvasContainer from './CanvasContainer';
import Header from './Header';
import Toolbox from './Toolbox';

const Layout: React.VFC = () => {
    return (
        <Box sx={{ width: '100vw', height: '100vh' }}>
            <Header />
            <Box
                sx={{
                    width: '100vw',
                    height: 'calc(100vh - 48px)',
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'nowrap',
                    alignItems: 'stretch',
                    pt: 1,
                    px: 1,
                }}
            >
                <Toolbox />
                <CanvasContainer />
            </Box>
        </Box>
    );
};

export default Layout;
