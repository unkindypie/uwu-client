const path = require('path');
const fs = require('fs');
const uwuDirRoot = path.resolve(process.cwd(), '.uwu');
const projectDirRoot = process.cwd();
let initialized = false;
let uwuIgnore = [...global.uwuIgnore = fs.readFileSync(path.resolve(projectDirRoot, '.uwuignore'))
    .toString()
    .split('\n').filter((string)=> string[0] !== '#'), '.uwu']
    .map(string => path.resolve(projectDirRoot, string));


console.log('IGNORE IT.', uwuIgnore);
module.exports = { uwuDirRoot, initialized, projectDirRoot, uwuIgnore }