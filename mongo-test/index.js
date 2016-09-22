const mongoClient = require('mongodb').MongoClient;
const assert = require('assert');

const connectionUrl = `mongodb://localhost:27017/mongo-test`;

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

const co = require('co');
co(function *() {

    let result;
    try {
        resutlt = yield Promise.resolve(2);
        // return {x: 1};
    } catch (error) {
        result = 3;
    } finally {
        return 5;
    }

    return result;
}).then((result) => {
    console.log('success:', result);
}).catch((error) => {
    console.log('fail:', error);
});