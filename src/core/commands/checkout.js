const RepositoryDB = require('../systems/RepositoryDB');
const global = require('../../global');
const Explorer = require('../systems/Explorer');
const Console = require('../../utils/ConsolePrintPresets');

module.exports = (args)=>{
    if(!global.initialized){
        Console.errorPrint('Repository is not initialized in this directory or you are trying to use it not in the root directory. :c')
        process.exit(-1);
    }
    try{
        if(!args._[1]){
            Console.errorPrint('No branch or commit specified! :c');
            process.exit(-1);
        }

        const repo = new RepositoryDB();
        
        //TODO check that if we are detached we should switch to this branch
        if(args._[1] === global.currentBranch || args._[1] === repo.getHead()){
            Console.commonPrint('You are already on this branch or commit.');
            process.exit(0);
        }

        //if argument is a branch
        if(repo.getBranches().some(({ name }) => name === args._[1])){
            repo.checkoutToBranch(args._[1]);
            Explorer.populateDir(repo.represent(repo.getHead()));
            Console.commonPrint(`Switched to branch '${args._[1]}'`);
        }
        //if argument is a commit
        else if(repo.getCommits(repo.getHead()).some(commit=> commit.id === args._[1])){
            console.log('checking out to commit...');
            //TODO: make a "detach" branch and checkout to this branch.
            // when user checkouted from this branch, it should be deleted
            Explorer.populateDir(repo.represent(args._[1]));
        }
        else {
            Console.errorPrint("There no commit or branch with this name. Maybe you are trying to checkout to commit in another branch? :(");
        }

    } catch(e) {
        if(global.debug){
            Console.errorPrint('Something went wrong!\n', e);
        }
        else{
            Console.errorPrint('Something went wrong!\n', e.message);
        }
    }
}