const path = require('path');
const uwuDirRoot = path.resolve(process.cwd(), '.uwu');
const projectDirRoot = process.cwd();
let initialized = false;
module.exports = { uwuDirRoot, initialized, projectDirRoot }