const fs = require('fs');
const RepositoryDB = require('../systems/RepositoryDB');
const global = require('../../global');
const Explorer = require('../systems/Explorer');
const Console = require('../../utils/ConsolePrintPresets');
const init = require('./init');

module.exports = (args)=>{
    const description = args.m || args.message;
    if(!global.initialized){
        Console.errorPrint('Uwu is not initialized in this directory! This command must be used in the root of the project directory.')
        process.exit(-1);
    }
    try{
        init();
        
        Console.commonPrint('Creating commit...')
        const repo = new RepositoryDB();
        Explorer.explore(repo);
        Console.successPrint('Done!');
    }
    catch(e){
        if(global.debug){
            Console.errorPrint('Something went wrong!\n', e);
        }
        else{
            Console.errorPrint('Something went wrong!\n', e.message);
        }
    }

}