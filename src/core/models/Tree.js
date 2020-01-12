//models exist for represinting entries from db in memory to avoid unnsessory requests to db
class Tree {
    subtrees;
    files;
    dirname;
    id;
    constructor(subtrees = [], files = [], dirname, id){
        this.subtrees = subtrees;
        this.files = files;
        this.dirname = dirname;
        this.id = id;
    }
}
module.exports = Tree;