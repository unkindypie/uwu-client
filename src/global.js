const path = require('path');
const fs = require('fs');
const os = require('os');
const { GetEnvVars } = require('env-cmd');

const uwuDirRoot = path.resolve(process.cwd(), '.uwu');
const projectDirRoot = process.cwd();
let initialized = false;
let uwuIgnore = [...global.uwuIgnore = fs.readFileSync(path.resolve(projectDirRoot, '.uwuignore'))
    .toString()
    .split(os.EOL).filter((string)=> string[0] !== '#'), '.uwu']
    .map(string => path.resolve(projectDirRoot, string));

let currentBranch = null;
const pathToProperties = path.resolve(uwuDirRoot, 'properties.json');
if(fs.existsSync(pathToProperties)){
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