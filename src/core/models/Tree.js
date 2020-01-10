//models exist for represinting entries from db in memory to avoid unnsessory requests to db
class Tree {
    subtrees;
    files;
    dirname;
    constructor(subtrees = [], files = [], dirname){
        this.subtrees = subtrees;
        this.files = files;
        this.dirname = dirname;
    }
}