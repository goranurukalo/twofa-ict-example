module.exports = function (db, tableName) {
    return {
        getAll: function (callback) {
            var data = db
                .get(tableName)
                .value();
                
            callback(false, data);
        },
        get: function (filter, callback) {
            var data = db
                .get(tableName)
                .find(filter)
                .value();

            callback(false, data);
        },
        create: function (obj, callback) {
            var data = db
                .get(tableName)
                .push(obj)
                .findLast()
                .write();

            callback(false, data);
        },
        update: function (id, obj, callback) {
            var data = db.get(tableName)
                .find({ _id: id })
                .assign(obj)
                .write();

            callback(false, data);
        },
        delete: function (id, callback) {
            var data = db
                .get(tableName)
                .remove({ _id: id })
                .write();

            callback(false, data);
        },

        //special filters
        getLastId: function(callback){
            var data = db
                .get(tableName)
                .findLast()
                .value();

            callback(false, data || 0);
        },
    };
}