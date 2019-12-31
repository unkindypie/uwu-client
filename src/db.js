const Database = require('better-sqlite3');
const path = require('path');
class RepositoryDB {
    constructor(uwuDirPath){
        this.db = new Database(path.resolve(uwuDirPath, 'repo.db'), { verbose: console.log });
        const stmt = this.db.prepare('SELECT date(\'now\') as dt');
        console.log(stmt.all());
    }
}

module.exports = RepositoryDB;