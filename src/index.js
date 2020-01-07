const yargs = require('yargs');
const fs = require('fs');
const global = require('./global.js');
//commands
const init = require('./core/commands/init.js');
const commit = require('./core/commands/commit');

global.initialized = fs.existsSync(global.uwuDirRoot);


yargs.command({
    command: 'init',
    describe: 'Creates empty uwu repository.',
    handler: init
})

yargs.command({
    command: 'commit',
    describe: 'Makes record of current state of the working directory except files or paths which are listed in .uwuignore.',
    handler: commit
})


yargs.parse();


