const yargs = require('yargs');
const init = require('./core/init.js');
const { uwuDirRoot } = require('./global.js');

yargs.command({
    command: 'init',
    describe: 'Creates empty uwu repository.',
    handler(args){
        init();
    }
})


yargs.parse();


