const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const global = require('../../global');
const { sha256 } = require('js-sha256');
const Console = require('../../utils/ConsolePrintPresets');
const Tree = require('../models/Tree');
const File = require('../models/File');

class RepositoryDB {

    constructor(args) {
        const uwuDirPath = path.resolve(global.uwuDirRoot, 'db');

        if (!fs.existsSync(path.resolve(uwuDirPath, 'repo.db'))) {
            this.inititalize(uwuDirPath, { mode: args.debug ? 'debug' : 'production' });
        }
        else {
            this.db = new Database(path.resolve(uwuDirPath, 'repo.db'), { verbose: this.onSqlLog });
        }
        this.preparedStatments = {
            getBranches: this.db.prepare("select * from branches"),
            lastInsertedRowId: this.db.prepare('select last_insert_rowid() as id')
        }
        //process.on('exit', ()=> this.db.close());
    }
    transaction(callback) {
        this.db.transaction(callback)();
    }
    onSqlLog(message) {
        if (!global.debug) return;
        console.log('SQLite:', message)
    }

    inititalize(uwuDirPath, initOptions) {
        fs.mkdirSync(uwuDirPath);
        uwuDirPath = path.resolve(uwuDirPath, 'repo.db');

        this.db = new Database(uwuDirPath, { verbose: this.onSqlLog });

        this.createTables();
        this.changeRepoProperies({
            uwuVersion: global.currentUwuVersion,
            ...initOptions
        })
    }

    getRepoProperties() {
        return JSON.parse(fs.readFileSync(path.resolve(global.uwuDirRoot, 'properties.json')));
    }
    changeRepoProperies(propsObj) {
        fs.writeFileSync(path.resolve(global.uwuDirRoot, 'properties.json'), JSON.stringify(propsObj));
    }

    createTables() {
        this.db.transaction(() => {
            //files table
            this.db
                .prepare("create table files (id integer primary key autoincrement, hash varchar(64) unique, file blob not null)")
                .run();

            this.db
                .prepare("create table entryNames (id integer primary key autoincrement, name nvarchar(255) unique)")
                .run();

            //tree table
            this.db
                .prepare("create table trees (id integer primary key autoincrement, dirnameId integer, parent integer, foreign key (parent) references trees(id), foreign key (dirnameId) references entryNames(id))")
                .run();

            //treeFiles table
            this.db
                .prepare("create table treeFiles (id integer primary key autoincrement, fileId integer, treeId integer, filenameId, foreign key (fileId) references files(id), foreign key (treeId) references trees(id), foreign key (filenameId) references entryNames(id))")
                .run();
            //commits table
            this.db
                .prepare("create table commits (id integer primary key autoincrement, parentId integer,"+
                " author integer, treeId integer, description nvarchar(255), timestamp unsigned big int, hash varchar(64),"+
                " foreign key (treeId) references trees(id), foreign key (parentId) references commits(id))")
                .run();
            //branches table
            this.db
                .prepare("create table branches (name nvarhar(15) primary key, head integer, foreign key (head) references commits(id))")
                .run();
            // //repo_info table (reference to current branch is stored here)
            // this.db
            //     .prepare("create table repo_info (head nvarhar(15), uwu_version numeric, foreign key (head) references branches(name))")
            //     .run();
        })()
    }
    addTree(parent, dirname, getId) {
        let resultId;
        this.db.transaction(() => {
   
            

            let nameId = this.db
                .prepare("select id from entryNames where name = @dirname")
                .get({ dirname });

            if(!nameId){
                this.db
                    .prepare("insert or ignore into entryNames values (null, @dirname)")
                    .run({ dirname });
                nameId = this.preparedStatments.lastInsertedRowId.get().id;
            }
            else {
                nameId = nameId.id;
            }
            
            this.db.prepare("insert into trees values (null, @nameId, @parent)")
                .run({ nameId, parent });

            if (getId) {
                resultId = this.preparedStatments.lastInsertedRowId.get().id;
            }
        })()
        return resultId;
    }
    /**
     * @param  {Array} filePath
     * Finds db column id of the folder with specified path stored as array of path entries without specifing root of the project.
     * Empty array will be understood as root of the project directory.
     */
    findDirByPathArray(filePath, rootTreeId) {
        if (filePath.length === 0) {
            return rootTreeId;
        }
        const targetDirName = filePath[filePath.length - 1];

        const trees = this.getSubtrees(rootTreeId);

        let next = rootTreeId;
        let result = -1;
        filePath.forEach((dirname, index) => {
            //const dir = this.db.prepare("select id, dirname from trees where parent = @nextId and dirname = @dirname").get({ nextId: next || 1, dirname });
            let dir = trees.filter(tree => tree.parent === next && dirname === tree.dirname)[0];

            //folder doesn't exist
            if (!dir) {
                return;
            }

            if (index === filePath.length - 1 && dir.dirname === targetDirName) {
                result = dir.treeId;
            }
            next = dir.treeId;
        });
        return result;
    }
    getSubtrees(rootTreeId) {
        const result = this.db
            .prepare("with recursive explore_dir(treeId, parent, dirname) as ( values(@rootTreeId, null, null)" +
                " union select trees.id, trees.parent, entryNames.name as dirname from trees, explore_dir" +
                " join entryNames on entryNames.id = trees.dirnameId"+
                " where explore_dir.treeId = trees.parent)" +
                " select treeId, parent, dirname from explore_dir")
            .all({ rootTreeId });
        result.shift();
        return result;
    }
    /**
     * Translets root tree from the commit to Tree objects and Files objects (blobs are not copied to ram, only their hash)
     * @param {*} commit 
     * referense to commit in the data base
     */
    represent(commit) {
        const getStraightChildren = (trees, id) => {
            return trees.filter(tree => tree.parent === id);
        }
        const populateTree = (rootTree, trees) => {
            const children = getStraightChildren(trees, rootTree.treeId)
            const files = this.db
                .prepare("select treeFiles.id, fileId, name as fileName from treeFiles join entryNames on entryNames.id = filenameId where treeId = @treeId")
                .all({ treeId: rootTree.treeId })
                .map(file => new File(file));
            return new Tree(
                children.map(tree => populateTree(tree, trees)),
                files,
                rootTree.dirname,
                rootTree.treeId
            );
        }
        const rootTreeId = this.db
            .prepare("select treeId from commits where id = @head")
            .get({ head: commit }).treeId;
        const subtrees = this.getSubtrees(rootTreeId)
        const rootTree = this.db
            .prepare("select trees.id as treeId, parent, name as dirname from trees join entryNames on entryNames.id = dirnameId where trees.id = @treeId")
            .get({ treeId: rootTreeId })
        return populateTree(rootTree, subtrees);
    }
    // Branch:
    getBranch(branchName) {
        return this.db
            .prepare("select * from branches where name = @branchName")
            .get({ branchName });
    }
    getBranches() {
        return this.preparedStatments.getBranches.all();
    }
    addBranch(branchName, headCommit) {
        if (branchName === '' || this.getBranch(branchName)) {
            Console.errorPrint(`Branch ${branchName} already exist in this repository.`)
            process.exit(-1);
        }
        this.db
            .prepare('insert into branches values (@branchName, @headCommit)')
            .run({ branchName, headCommit });
    }
    checkoutToBranch(branchName) {
        const exists = !!this.getBranch(branchName);

        if (!exists) {
            Console.errorPrint(`Branch ${branchName} doesn't exist in this repository.`)
            process.exit(-1);
        }

        this.changeRepoProperies({ ...this.getRepoProperties(), head: branchName })
        global.currentBranch = branchName;
    }
    // File:
    addFile(data, fileName, treeId) {
        const hash = sha256.hex(data);
        this.db.transaction(() => {
            this.db.prepare("insert or ignore into files values (null, @hash, @data)")
                .run({ hash, data });


            let nameId = this.db
                .prepare("select id from entryNames where name = @fileName")
                .get({ fileName });

            if(!nameId){
                this.db
                    .prepare("insert or ignore into entryNames values (null, @fileName)")
                    .run({ fileName });
                nameId = this.preparedStatments.lastInsertedRowId.get().id;
            }
            else nameId = nameId.id;


            this.db.prepare("insert into treeFiles values (null, (select id from files where hash = @hash), @treeId, @nameId)")
                .run({ hash, treeId, nameId });
        })()
        return hash;
    }
    // Commit:
    getHead() {
        return this.db
            .prepare("select head from branches where name = @branch")
            .get({ branch: global.currentBranch }).head;
    }

    addCommit(rootTreeId, description, hash) {

        //TODO: set the author
        this.db.transaction(() => {
            const head = this.getHead();
            this.db
                .prepare('insert into commits values (null, @head, null, @rootTreeId, @description, @time, @hash)')
                .run({ rootTreeId, description, head, time: Date.now(), hash })

            this.db
                .prepare("update branches set head = ( select last_insert_rowid() ) where name = @headBranch")
                .run({ headBranch: global.currentBranch })
        })()
    }

    getCommits(headCommit) {
        const result = this.db
            .prepare("with recursive parent_commit(parent, id, treeId, description, timestamp, author) as ( values(@headCommit, null, null, null, null, null) union select parentId as parent, commits.id, commits.treeId, commits.description, commits.timestamp, commits.author from commits, parent_commit where parent_commit.parent = commits.id) select parent, id, treeid, author, description, timestamp from parent_commit")
            .all({ headCommit });
        result.shift();
        return result;
    }

    getBlob(id){
        return this.db
            .prepare("select file from files where id = @id")
            .get({ id }).file
    }
}

module.exports = RepositoryDB;