const fs = require('fs');
const path = require('path');
const { deleteFolderRecursive } = require('../utils/files');
const RepositoryDB = require('../db');
require('./exploration');


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

    repo.addTree(null, 'some directory name');
    const contents = fs.readFileSync(path.join(__dirname, 'exploration.js'));
    repo.addFile('/efef/fffe', contents)

    console.log('Done!');
}

module.exports = init;