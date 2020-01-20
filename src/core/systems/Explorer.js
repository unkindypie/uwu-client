const fs = require('fs');
const path = require('path');
const global = require('../../global');
const RepositoryDB = require('./RepositoryDB');
const chalk = require('chalk');
let repo = null;
class Explorer {
    static _rootTree = null;
    /**
     * Translates physical directory on disk to tables on data base including directories and files
     * @param {*} repo_ 
     * 
     */
    static explore(repo_ = new RepositoryDB()) {
        repo = repo_;
        //adding the root directory to the repository data base 
        this._rootTree = repo.addTree(null, path.parse(global.projectDirRoot).name, true);
        //recursive walk through dirs in the project and adding them to the db including files and relations between files and dirs
        this._exploreDir(global.projectDirRoot);
        return this._rootTree;

    }
    static isIgnored(path) {
        return global.uwuIgnore.some(ignoredPath => path === ignoredPath);
    }

    static _exploreDir(initialPath, subdirs = []) {

        const currentPath = path.resolve(initialPath, ...subdirs);
        const contents = fs.readdirSync(currentPath);
        contents.forEach((entry) => {

            const nextPath = path.resolve(currentPath, entry);
            if (this.isIgnored(nextPath)) return;

            const treeId = repo.findDirByPathArray(subdirs, this._rootTree);

            //console.log(entry, subdirs, nextPath);
            if (fs.lstatSync(nextPath).isDirectory()) {
                repo.addTree(treeId, entry);
                this._exploreDir(initialPath, [...subdirs, entry]);
            }
            else { //adding file to current directory
                repo.addFile(this.readFile(nextPath), entry, treeId);
            }
        })

    }
    /**
     * Writes to disk Tree object starting from the root of the project. This method is the oposit
     * to explore() because Tree object is representation of the root directory of the commit from data base.
     * @param {*} tree 
     * Tree object (instance of src/models/Tree.js) that must be the root of the project directory.
     * RepositoryDB_instance.represent() is used for getting this Tree object.
     */
    static populateDir(tree) {
        if (!repo) {
            repo = new RepositoryDB();
        }
        tree.dirname = '';
        const _populateDir = (tree, path_) => {
            const pathToTree = path.resolve(path_, tree.dirname);
            if (tree.dirname !== '' && !fs.existsSync(pathToTree)) {
                fs.mkdirSync(pathToTree);
                //console.log('mkdir as', pathToTree);
            }
            tree.files.forEach(file => {
                fs.writeFileSync(path.resolve(pathToTree, file.fileName), repo.getBlob(file.id));
                //console.log('writing file', file.fileName, 'in dir', pathToTree)
            })

            tree.subtrees.forEach(subtree => _populateDir(subtree, pathToTree));

        }
        _populateDir(tree, global.projectDirRoot);

        /*

        TODO: 
        
            1)
            make a diff from prev and current commit trees
            and delete it from directory before making populate.
            2)
            in case of that prev and cur dirs have files with the same hash
            but different name do not write this file, just rename.
            if this files have the same hash and name do not rewrite them.

        */
    }

    static readFile(path) {
        try {
            fs.accessSync(path, fs.constants.R_OK);
            return fs.readFileSync(path);
        } catch (e) {
            console.log(chalk.red.underline('No access to file: ', path));
            process.exit(-1);
            //throw new Error('No access to file!');
        }
    }

    static fsDeleteFolderRecursive(dirPath) {
        if (dirPath === '' || dirPath === '/') throw new Error('This path is dangerous!');
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