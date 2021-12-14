import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import React from 'react';
import Layout from './Layout';

const theme = createTheme();

const App: React.VFC = () => {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Layout />
        </ThemeProvider>
    );
};

export default App;
