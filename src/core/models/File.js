class File {
    hash;
    fileName;
    id;
    treeFileId;
    constructor(dbFile){
        this.hash = dbFile.hash;
        this.id = dbFile.fileId;
        this.treeFileId = dbFile.id;
        this.fileName = dbFile.fileName;
    }
    getBlob(){
        //TODO.
    }
}

module.exports = File;