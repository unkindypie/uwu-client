const fs = require('fs');
const path = require('path');
const global = require('../../global');
const RepositoryDB = require('./RepositoryDB');
const chalk = require('chalk');
let repo = null;
class Explorer {

    static explore(repo_ = new RepositoryDB()){
        repo = repo_;
        //adding the root directory to the repository data base 
        repo.addTree(null, path.parse(global.projectDirRoot).name);
        //recursive walk through dirs in the project and adding them to the db including files and relations between files and dirs
        this._exploreDir(global.projectDirRoot);

    }
    static isIgnored(path){
        return global.uwuIgnore.some(ignoredPath => path === ignoredPath);
    }

    static _exploreDir(initialPath, subdirs = []){

        const currentPath = path.resolve(initialPath, ...subdirs);
        const contents = fs.readdirSync(currentPath);
        contents.forEach((entry)=>{

            const nextPath = path.resolve(currentPath, entry);
            if(this.isIgnored(nextPath)) return;
            
            //console.log(entry, subdirs, nextPath);
            if(fs.lstatSync(nextPath).isDirectory()){
                repo.addTree(repo.findDirByPathArray(subdirs), entry);
                this._exploreDir(initialPath, [...subdirs, entry]);
            }
            else { //adding file to current directory
                repo.addFile(this.readFile(nextPath), subdirs, entry);
            }
        })
        
    }
    
    static readFile(path){
        try{
            fs.accessSync(path, fs.constants.R_OK);
            return fs.readFileSync(path);
        }catch(e){
            console.log(chalk.red.underline('No access to file: ', path));
            process.exit(-1);
            //throw new Error('No access to file!');
        }
    }

    static fsDeleteFolderRecursive(dirPath) {
        if(dirPath === '' || dirPath === '/') throw new Error('This path is dangerous!');
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach((file, index) => {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    this.fsDeleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    };
}

module.exports = Explorer;