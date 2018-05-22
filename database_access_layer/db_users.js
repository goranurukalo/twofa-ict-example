module.exports = function (db) {
    const tableName = "users";
    const dbGeneric = require("./db_generic")(db, tableName);
    
    return {
        ...dbGeneric,

        //todo
    };
}