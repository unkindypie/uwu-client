const path = require('path');
const uwuDirRoot = path.resolve(process.cwd(), '.uwu');
let initialized = false;
module.exports = { uwuDirRoot, initialized }