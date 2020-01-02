const fs = require('fs');
const path = require('path');
const global = require('../global');
const RepositoryDB = require('../db');

class Explorer {
    
    explore(repo){
        if(!repo){
            repo = new RepositoryDB();
        }
        this.repo = repo;
    }
}