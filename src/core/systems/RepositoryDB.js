const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const global = require('../../global');
const { sha256 } = require('js-sha256');
const Console = require('../../utils/ConsolePrintPresets');

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
            getBranches: this.db.prepare("select * from branches")
        }
        //process.on('exit', ()=> this.db.close());
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

    getRepoProperties(){
        return JSON.parse(fs.readFileSync(path.resolve(global.uwuDirRoot, 'properties.json')));
    }
    changeRepoProperies(propsObj){
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
        this.db.transaction(()=>{
            this.db.prepare("insert into trees values (null, @dirname, @parent)")
            .run({ dirname, parent });
            if(getId){
                resultId = this.db.prepare('select last_insert_rowid() as id')
                .get().id;
            }
        })()
        return resultId;
    }
    /**
     * 
     * @param {string} filePath 
     * Finds db column id of folder with specified path. Path should start from root of the project.
     */
    findDirByPathString(filePath) {
        let parsedDirs = filePath.split(path.sep);
        const targetDirName = path.parse(filePath).name;

        if (parsedDirs.length === 2 && parsedDirs[0] === '' && parsedDirs[1] === '') {
            return 1; //projet root dir
        }
        parsedDirs = parsedDirs.filter((_, i) => i != 0);
        let next;
        let result = -1;
        parsedDirs.forEach((dirname, index) => {
            const dir = this.db.prepare("select id, dirname from trees where parent = @nextId and dirname = @dirname").all({ nextId: next || 1, dirname })[0];

            //folder does't exist
            if (!dir) {
                return;
            }

            if (index === parsedDirs.length - 1 && dir.dirname === targetDirName) {
                result = dir.id;
            }
            next = dir.id;
        });
        return result;
    }
    /**
     * @param  {Array} filePath
     * Finds db column id of the folder with specified path stored as array of path entries without specifing root of the project.
     * Empty array will be understood as root of the project directory.
     */
    findDirByPathArray(filePath) {
        if (filePath.length === 0) {
            return 1;
        }
        const targetDirName = filePath[filePath.length - 1];

        let next;
        let result = -1;
        filePath.forEach((dirname, index) => {
            const dir = this.db.prepare("select id, dirname from trees where parent = @nextId and dirname = @dirname").all({ nextId: next || 1, dirname })[0];

            //folder doesn't exist
            if (!dir) {
                return;
            }

            if (index === filePath.length - 1 && dir.dirname === targetDirName) {
                result = dir.id;
            }
            next = dir.id;
        });
        return result;
    }
    getBranch(branchName){
        return this.db
            .prepare("select * from branches where name = @branchName")
            .get({ branchName });
    }
    getBranches(){
        return this.preparedStatments.getBranches.all();
    }
    addBranch(branchName, headCommit) {
        if(branchName === '' || this.getBranch(branchName)){
            Console.errorPrint(`Branch ${branchName} already exist in this repository.`)
            process.exit(-1);
        }
        this.db
            .prepare('insert into branches values (@branchName, @headCommit)')
            .run({branchName, headCommit});
    }
    checkoutToBranch(branchName) {
        const exists = !!this.getBranch(branchName);

        if(!exists){
            Console.errorPrint(`Branch ${branchName} doesn't exist in this repository.`)
            process.exit(-1);
        }

        this.changeRepoProperies({ ...this.getRepoProperties(), head: branchName})
        global.currentBranch = branchName;
    }
    addFile(data, pathArray, fileName) {
        const hash = sha256.hex(data);
        this.db.transaction(()=>{
            this.db.prepare("insert or ignore into files values (@hash, @data)")
            .run({ hash, data });
            this.db.prepare("insert into treeFiles values (null, @hash, @treeId, @fileName)")
            .run({ hash, treeId: this.findDirByPathArray(pathArray), fileName });
        })()
    }

    getHead(){
        return this.db
            .prepare("select head from branches where name = @branch")
            .get({ branch: global.currentBranch }).head;
    }

    addCommit(rootTreeId, description){
        
        //TODO: set the author
        this.db.transaction(()=>{
            const head = this.getHead();
            this.db
                .prepare('insert into commits values (null, @head, null, @rootTreeId, @description, @time)')
                .run({ rootTreeId, description, head, time: Date.now() })

            this.db
                .prepare("update branches set head = ( select last_insert_rowid() ) where name = @headBranch")
                .run({ headBranch: global.currentBranch })
        })()
    }

}

module.exports = RepositoryDB;