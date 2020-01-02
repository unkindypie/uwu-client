const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { sha256 } = require('js-sha256');



class RepositoryDB {

    constructor(uwuDirPath){
        uwuDirPath = path.resolve(uwuDirPath, 'db');

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
            .prepare("create table files (hash varchar(64) primary key, file blob)")
            .run();

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
    addFile(path, data){
        this.db.prepare("insert into files values (@hash, @data)")
        .run({hash: sha256.hex(data), data});
    }
}

module.exports = RepositoryDB;