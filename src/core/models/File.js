class File {
    hash;
    fileName;
    constructor(dbFile){
        this.hash = dbFile.fileId;
        this.fileName = dbFile.fileName;
    }
    getBlob(){
        //TODO.
    }
}

module.exports = File;