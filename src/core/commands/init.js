const fs = require('fs');
const path = require('path');
const RepositoryDB = require('../systems/RepositoryDB');
const global = require('../../global');
const Explorer = require('../systems/Explorer');


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

        // repo.addTree(null, 'MyProjectRoot');
        // const contents = fs.readFileSync(path.join(__dirname, 'exploration.js'));
        // repo.addFile(contents);
        // repo.addFile(contents);
        // repo.addFile(contents);
        // repo.addFile(contents);

        // repo.addTree(1, 'src');
        // repo.addTree(2, 'core');
        // repo.addTree(3, 'dummyfolder');

        // //console.log(repo.findDirByPath('\\src\\core'));
        // console.log(repo.findDirByPathString('/src/core'));
        // console.log(repo.findDirByPathString('/'));
        // console.log(repo.findDirByPathString('/'));
        // console.log(repo.findDirByPathArray(['src', 'core']));
        // console.log(repo.findDirByPathArray([]));

        Explorer.explore(repo);

    } catch(e){
        global.initialized = false;
        console.log('Something went wrong!', e);
    }   
    

    

    console.log('Done!');
}

module.exports = init;