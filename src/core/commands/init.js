const fs = require('fs');
const path = require('path');
const RepositoryDB = require('../systems/RepositoryDB');
const global = require('../../global');
const Explorer = require('../systems/Explorer');
const chalk = require('chalk');

const init = ()=>{
    const uwuPath = global.uwuDirRoot;
    if(global.initialized){
        console.log('Uwu repository already initialized in this directory! Reinitializing started...')
        Explorer.fsDeleteFolderRecursive(uwuPath);
        global.initialized = false;
    }
    else{
        console.log('Initializing...');
    }
    try{
        fs.mkdirSync(uwuPath);
        const repo = new RepositoryDB();
        Explorer.explore(repo);
        console.log('Done!');
    } catch(e){
        global.initialized = false;
        if(process.env.DEBUG){
            console.log(chalk.bgRed.bold('Something went wrong!'), e);
        }
        else{
            console.log(chalk.bgRed.bold('Something went wrong!'), e.message);
        }
        
    }   
}

module.exports = init;