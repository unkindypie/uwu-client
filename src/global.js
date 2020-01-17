const path = require('path');
const fs = require('fs');
const os = require('os');

const uwuDirRoot = path.resolve(process.cwd(), '.uwu');
const initialized = fs.existsSync(uwuDirRoot);
const projectDirRoot = process.cwd();
const _pathToUwuIgnore = path.resolve(projectDirRoot, '.uwuignore')

//reading and parsing .uwuignore
let uwuIgnore = ['.uwu'];
if (fs.existsSync(_pathToUwuIgnore)) {
    uwuIgnore = [...uwuIgnore, ...fs.readFileSync(_pathToUwuIgnore)
        .toString()
        .split(os.EOL).filter((string) => string[0] !== '#')]
}
uwuIgnore = uwuIgnore.map(string => path.resolve(projectDirRoot, string));

//reading properties.json from .uwu dir
let properites = { mode: 'production' };
const pathToProperties = path.resolve(uwuDirRoot, 'properties.json');
if (fs.existsSync(pathToProperties)) {
    properites = JSON.parse(fs.readFileSync(pathToProperties));
}


module.exports = {
    uwuDirRoot,
    initialized,
    projectDirRoot,
    uwuIgnore,
    currentUwuVersion: require('../package.json').version,
    debug: properites.mode === "debug",
    currentBranch: properites.head
}