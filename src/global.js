const path = require('path');
const fs = require('fs');
const os = require('os');

const uwuDirRoot = path.resolve(process.cwd(), '.uwu');
const initialized = fs.existsSync(uwuDirRoot);
const projectDirRoot = process.cwd();
const _pathToUwuIgnore = path.resolve(projectDirRoot, '.uwuignore')
let uwuIgnore = [];
if (fs.existsSync(_pathToUwuIgnore)) {
    uwuIgnore = [...fs.readFileSync(_pathToUwuIgnore)
        .toString()
        .split(os.EOL).filter((string) => string[0] !== '#'), '.uwu']
        .map(string => path.resolve(projectDirRoot, string));
}

let currentBranch = null;
const pathToProperties = path.resolve(uwuDirRoot, 'properties.json');
if (fs.existsSync(pathToProperties)) {
    currentBranch = JSON.parse(fs.readFileSync(pathToProperties)).head;
}

module.exports = {
    uwuDirRoot,
    initialized,
    projectDirRoot,
    uwuIgnore,
    currentUwuVersion: require('../package.json').version,
    debug: false,
    currentBranch
}