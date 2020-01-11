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
        const repo = new RepositoryDB();
        if(args._[1]){
            repo.addBranch(args._[1], repo.getHead());
        }
        else if(args.d){
            //TODO: deleting branch with recursive deletign trees and blobs that are used nowhere except in this commit 
            
            //1: собрать множество комитов всех(кроме этой) веток(от head ветки до конца связанного списка) и множество комитов текущей ветки 
                // => их разница это те комиты, которые нужно удалить
            Console.commonPrint('Deliting branch ', args.d);
        }
        else {
            repo.getBranches().forEach(({ name: branch })=>{
                if(branch === global.currentBranch){
                    Console.hightlightedPrint('*', branch);
                    return;
                }
                Console.commonPrint(branch);
            })
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