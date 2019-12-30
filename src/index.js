const yargs = require('yargs');
const init = require('./core/init.js');

yargs.command({
    command: 'init',
    describe: 'Creates empty uwu repository.',
    handler(args){
        init();
    }
})


yargs.parse();


