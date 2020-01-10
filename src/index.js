const yargs = require('yargs');
//commands
const init = require('./core/commands/init.js');
const commit = require('./core/commands/commit');
const branch = require('./core/commands/branch');



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

yargs.command({
    command: 'branch',
    describe: 'Multifunctional command for listing, creating and deleting branches.',
    handler: branch
})


yargs.parse();


