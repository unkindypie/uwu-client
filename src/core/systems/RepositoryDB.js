const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const global = require('../../global');
const { sha256 } = require('js-sha256');
const Console = require('../../utils/ConsolePrintPresets');
const Tree = require('../models/Tree');
const File = require('../models/File');

class RepositoryDB {

    constructor() {
        const uwuDirPath = path.resolve(global.uwuDirRoot, 'db');

        if (!fs.existsSync(path.resolve(uwuDirPath, 'repo.db'))) {
            this.inititalize(uwuDirPath);
        }
        else {
            this.db = new Database(path.resolve(uwuDirPath, 'repo.db'), { verbose: this.onSqlLog });
        }
        this.preparedStatments = {
            getBranches: this.db.prepare("select * from branches"),
        }
        //process.on('exit', ()=> this.db.close());
    }
    transaction(callback) {
        this.db.transaction(callback)();
    }
    onSqlLog(message) {
        if (global.debug) return;
        console.log('SQLite:', message)
    }

    inititalize(uwuDirPath) {
        fs.mkdirSync(uwuDirPath);
        uwuDirPath = path.resolve(uwuDirPath, 'repo.db');

        this.db = new Database(uwuDirPath, { verbose: this.onSqlLog });

        this.createTables();
        this.changeRepoProperies({
            uwuVersion: global.currentUwuVersion,
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
                .prepare("create table files (hash varchar(64) primary key, file blob not null)")
                .run();

            //tree table
            this.db
                .prepare("create table trees (id integer primary key autoincrement, dirname nvarchar(255), parent integer, foreign key (parent) references trees(id))")
                .run();

            //treeFiles table
            this.db
                .prepare("create table treeFiles (id integer primary key autoincrement, fileId varchar(64), treeId integer, fileName nvarchar(255), foreign key (fileId) references files(hash), foreign key (treeId) references trees(id))")
                .run();
            //commits table
            this.db
                .prepare("create table commits (id integer primary key autoincrement, parentId integer, author integer, treeId integer, description nvarchar(255), timestamp unsigned big int, foreign key (treeId) references trees(id), foreign key (parentId) references commits(id))")
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
            this.db.prepare("insert into trees values (null, @dirname, @parent)")
                .run({ dirname, parent });
            if (getId) {
                resultId = this.db.prepare('select last_insert_rowid() as id')
                    .get().id;
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
                " union select trees.id, trees.parent, trees.dirname from trees, explore_dir" +
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
    explore(commit) {
        const getStraightChildren = (trees, id) => {
            return trees.filter(tree => tree.parent === id);
        }
        const populateTree = (rootTree, trees) => {
            const children = getStraightChildren(trees, rootTree.treeId)
            const files = this.db
                .prepare("select fileId, fileName from treeFiles where treeId = @treeId")
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
            .prepare("select id as treeId, parent, dirname from trees where id = @treeId")
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
            this.db.prepare("insert or ignore into files values (@hash, @data)")
                .run({ hash, data });
            this.db.prepare("insert into treeFiles values (null, @hash, @treeId, @fileName)")
                .run({ hash, treeId, fileName });
        })()
    }
    // Commit:
    getHead() {
        return this.db
            .prepare("select head from branches where name = @branch")
            .get({ branch: global.currentBranch }).head;
    }

    addCommit(rootTreeId, description) {

        //TODO: set the author
        this.db.transaction(() => {
            const head = this.getHead();
            this.db
                .prepare('insert into commits values (null, @head, null, @rootTreeId, @description, @time)')
                .run({ rootTreeId, description, head, time: Date.now() })

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
}

module.exports = RepositoryDB;