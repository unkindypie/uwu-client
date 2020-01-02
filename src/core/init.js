const fs = require('fs');
const path = require('path');
const { deleteFolderRecursive } = require('../utils/files');
const RepositoryDB = require('../db');
const global = require('../global');
require('./exploration');


const init = ()=>{
    const uwuPath = global.uwuDirRoot;
    if(global.initialized){
        console.log('Uwu repository already initialized in this directory! Reinitializing started...')
        deleteFolderRecursive(uwuPath);
        global.initialized = false;
    }
    else{
        console.log('Initializing...');
    }
    try{
        fs.mkdirSync(uwuPath);
        const repo = new RepositoryDB();

        repo.addTree(null, 'MyProjectRoot');
        const contents = fs.readFileSync(path.join(__dirname, 'exploration.js'));
        repo.addFile(contents);
        repo.addFile(contents);
        repo.addFile(contents);
        repo.addFile(contents);

        repo.addTree(1, 'src');
        repo.addTree(2, 'core');
        repo.addTree(3, 'dummyfolder');

        console.log(repo.findDirByPath('\\src\\core'));
    } catch(e){
        global.initialized = false;
        console.log('Something went wrong!', e);
    }   
    

    

    console.log('Done!');
}

module.exports = init;