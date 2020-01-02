const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const global = require('./global');
const { sha256 } = require('js-sha256');



class RepositoryDB {

    constructor(){
        const uwuDirPath = path.resolve(global.uwuDirRoot, 'db');

        if(!fs.existsSync(path.resolve(uwuDirPath, 'repo.db'))){
            this.inititalize(uwuDirPath);
        }
        else{
            this.db = new Database(path.resolve(uwuDirPath, 'repo.db'), { verbose: this.onSqlLog});
        }
        //process.on('exit', ()=> this.db.close());
    }
    onSqlLog(message){
        if(!process.env.DEBUG) return;
        console.log('SQLite:', message)
    }

    inititalize(uwuDirPath){
        fs.mkdirSync(uwuDirPath);
        uwuDirPath = path.resolve(uwuDirPath, 'repo.db');
       
        this.db = new Database(uwuDirPath, { verbose: this.onSqlLog });

        this.createTables();
    }

    createTables(){
        this.db.transaction(()=>{
            //files table
            this.db
            .prepare("create table files (hash varchar(64) primary key, file blob not null)")
            .run();

            // this.db
            // .prepare("create trigger files_insert_trigger instead of insert on files begin select * from files end;")

            //tree table
            this.db
            .prepare("create table trees (id integer primary key autoincrement, dirname nvarchar(255), parent integer, foreign key (parent) references trees(id))")
            .run(); 
       
            //treeFiles table
            this.db
            .prepare("create table treeFiles (id integer primary key autoincrement, fileId varchar(64), treeId integer, foreign key (fileId) references files(hash), foreign key (treeId) references trees(id))")
            .run();
        })()
    }
    addTree(parent, dirname){
        this.db.prepare("insert into trees values (null, @dirname, @parent)")
        .run({dirname, parent});
    }
    /*
        Finds db column id of folder with specified path. Path should start from root of the project.
    */
    findDirByPath(filePath){
        let parsedDirs = filePath.split(path.sep);
        const targetDirName = path.parse(filePath).name;

        if(parsedDirs.length === 2 && parsedDirs[0]==='' && parsedDirs[1]===''){
            return 1; //projet root dir
        }
        parsedDirs = parsedDirs.filter((_, i) => i != 0);
        let next;
        let result = -1;
        parsedDirs.forEach((dirname, index) => {
            const dir = this.db.prepare("select id, dirname from trees where parent = @nextId and dirname = @dirname").all({nextId: next || 1, dirname})[0];

            //folder does't exist
            if(!dir){
                return;
            }

            if(index === parsedDirs.length - 1 && dir.dirname === targetDirName){
                result = dir.id;
            }
            next = dir.id;
        });
        return result;
    }
    addFile(data){
        this.db.prepare("insert or ignore into files values (@hash, @data)")
        .run({hash: sha256.hex(data), data});
    }
    addFileToDir(filePath, data){

    }
}

module.exports = RepositoryDB;