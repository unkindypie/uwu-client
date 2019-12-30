const fs = require('fs');
const path = require('path');



const init = ()=>{
    if(fs.existsSync(path.resolve(process.cwd(), '.uwu'))){
        console.log('Uwu repository already exists in this directory!');
    }
    else{
        console.log('Initializing...');
    }
}

module.exports = init;