const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')

const adapter = new FileSync('./app_data/database/db.json')
const db = low(adapter);

db.defaults({ users: [] })
  .write()

//send db_generic class to all 
exports.users = require("./../database_access_layer/db_users")(db);
