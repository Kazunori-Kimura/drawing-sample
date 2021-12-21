import { Typography } from '@mui/material';

const hash = process.env.REACT_APP_GIT_COMMIT_HASH?.substring(0, 7) ?? '';
const date = process.env.REACT_APP_GIT_COMMIT_DATE ?? '';
const version = process.env.REACT_APP_PACKAGE_VERSION ?? '';

const Version: React.VFC = () => {
    return (
        <Typography
            variant="caption"
            sx={{ ml: 2 }}
        >{`ver ${version} (${hash}: ${date})`}</Typography>
    );
};

export default Version;
