const fs = require('fs');
const path = require('path');
const { deleteFolderRecursive } = require('../utils/files');
const RepositoryDB = require('../db');

const init = ()=>{
    const uwuPath = path.resolve(process.cwd(), '.uwu');
    if(fs.existsSync(uwuPath)){
        console.log('Uwu repository already initialized in this directory! Reinitializing started...')
        deleteFolderRecursive(uwuPath);
    }
    else{
        console.log('Initializing...');
    }   
    fs.mkdirSync(uwuPath);
    const repo = new RepositoryDB(uwuPath);


    console.log('Done!');
}

module.exports = init;