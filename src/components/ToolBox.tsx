import { AutoFixNormal, Edit } from '@mui/icons-material';
import { Button, Stack, Typography } from '@mui/material';

const ToolBox: React.VFC = () => {
    return (
        <Stack sx={{ width: '12rem', px: 2 }} spacing={2} alignItems="flex-start">
            <Typography variant="caption">toolbox</Typography>
            <Button startIcon={<Edit />} variant="contained" color="inherit" sx={{ width: '8rem' }}>
                Line
            </Button>
            <Button
                startIcon={<AutoFixNormal />}
                variant="contained"
                color="inherit"
                sx={{ width: '8rem' }}
            >
                Eraser
            </Button>
        </Stack>
    );
};

export default ToolBox;
