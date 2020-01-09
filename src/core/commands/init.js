const fs = require('fs');
const RepositoryDB = require('../systems/RepositoryDB');
const global = require('../../global');
const Explorer = require('../systems/Explorer');
const Console = require('../../utils/ConsolePrintPresets');

const init = ()=>{
    const uwuPath = global.uwuDirRoot;
    try{
        if(global.initialized){
            Console.commonPrint('It seems that uwu repository already initialized in this directory! Reinitialization started...')
            Explorer.fsDeleteFolderRecursive(uwuPath);
            global.initialized = false;
        }
        else{
            Console.commonPrint('Welcome to uwu!\n', 'Initializing...');
        }

        fs.mkdirSync(uwuPath);
        const repo = new RepositoryDB();
        repo.addBranch('master', null);
        repo.checkoutToBranch('master');

        repo.db.close();
        Console.successPrint('Done!');
    } catch(e){
        global.initialized = false;
        if(global.debug){
            Console.errorPrint('Something went wrong!\n', e);
        }
        else{
            Console.errorPrint('Something went wrong!\n', e.message);
        }
        
    }   
}

module.exports = init;