const RepositoryDB = require('../systems/RepositoryDB');
const global = require('../../global');
const Explorer = require('../systems/Explorer');
const Console = require('../../utils/ConsolePrintPresets');

module.exports = (args)=>{
    const description = args.m || args.message;
    if(!global.initialized){
        Console.errorPrint('Repository is not initialized in this directory or you are trying to use it not in the root directory. :c')
        process.exit(-1);
    }
    try{
        
        Console.commonPrint('Creating commit...')
        const repo = new RepositoryDB();
        repo.transaction(()=>{
            const { rootTree, hash } = Explorer.explore(repo);
            repo.addCommit(rootTree, description, hash);
        })
        

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