const yargs = require('yargs');
const init = require('./core/commands/init.js');
const global = require('./global.js');
const fs = require('fs');
global.initialized = fs.existsSync(global.uwuDirRoot);


yargs.command({
    command: 'init',
    describe: 'Creates empty uwu repository.',
    handler: init
})


yargs.parse();


