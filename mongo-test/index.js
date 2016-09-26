const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const connectionUrl = `mongodb://mongo:27017/mongo-test`;

function insertDocuments(db, callback) {
    const collection = db.collection('documents');

    collection.insertMany([{a: 1}, {a: 2}, {a: 3}], (err, result) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log(result);
        console.log('Inserted 3 documents into the collection');
        callback(result);
    });
}

function findDocuments(db, callback) {
    const collection = db.collection('documents');

    collection.find({a: 2}).toArray((err, docs) => {
        assert.equal(err, null);
        console.log('Found the following records:');
        console.log(docs);
        callback(docs);
    })
};

function updateDocument(db, callback) {
    const collection = db.collection('documents');

    collection.updateOne({a: 2}, { $set: {b: 1}}, (err, result) => {
        assert.equal(err, null);
        assert.equal(1, result.result.n);
        callback(result);
    })
}

const co = require('co');

    co(function * () {
        let db;
        try {
            console.log('Trying to connect to mongo');
            db = yield MongoClient.connect(connectionUrl);
            console.log('Connected successfully');
            const collection = db.collection('documents');
            let docs = yield collection.find().toArray();

            if (docs.length === 0) {
                docs = yield collection.insertMany([{a: 1}, {a: 2}, {a: 3}]);
            }
            console.log('Found the following records:');
            console.log(docs);
        } catch(error) {
            console.log(error);
        } finally {
            db && db.close();
        }
    });


// mongoClient.connect(connectionUrl, (err, db) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
//
//     console.log('Connected!');
//     // insertDocuments(db, () => { db.close(); });
//
//     updateDocument(db, () => {
//         findDocuments(db, () => { db.close();  });
//     });
// });

