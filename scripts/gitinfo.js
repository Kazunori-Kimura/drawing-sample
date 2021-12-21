/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const { version } = require('../package.json');

exports.REACT_APP_PACKAGE_VERSION = version;
exports.REACT_APP_GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString();
exports.REACT_APP_GIT_COMMIT_DATE = execSync(
    'git log --date=iso --date=format:"%Y/%m/%d %H:%M:%S" --pretty=format:"%ad" -1'
).toString();
