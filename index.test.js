const findOrCreate = require('.');
const assert = require('assert');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = process.env.db || "mongodb://localhost:27017/findOrCreateTest";

/* Defining the Test model */
const schema = mongoose.Schema({
    name: String,
    age: Number
});

schema.statics.findOrCreate = findOrCreate;
const TestModel = mongoose.model("Test", schema);

// Connect to the database before everything
before(function(done) {
    mongoose.connection
    .on('error', done)
    .once('open', done);

    mongoose.connect(db);
});

// Clear the test collection before each new test and add a new test record
beforeEach(function(done) {
    TestModel.remove({}, () => {
        TestModel.create({name: "Conan", age: 28}, done);
    });
});

// Start the tests
describe("Basic tests", function() {
    it('should does not throw an expection, when callback and options are not provided', function(done) {
        TestModel.findOrCreate({}, null).exec(done);
    });

    it('should catch an error when an incorrect number of arguments are passed', function(done) {
        assert.throws(function() {
            TestModel.findOrCreate();
        }, Error);

        assert.throws(function() {
            TestModel.findOrCreate({});
        }, Error);

        done()
    });

    it('should catch a promise error when an issue happens with the query', function(done) {
        TestModel.findOrCreate({"$thisOperatorDoesNotExists": true}, null)
        .catch((err) => done(null));
    });
});

/* No upserting tests */
describe("Find or create without upserting", function() {
    it('should returns the document found, using the callback style', function(done) {
        const doc = {name: "Conan"};

        TestModel.findOrCreate(doc, null, (err, result) => {
            assert.ifError(err);
            assert(result.doc);
            assert.strictEqual(result.isNew, false);
            done();
        });
    });

    it('should returns the document found, using the promise return', function(done) {
        const doc = {name: "Conan"};

        TestModel.findOrCreate(doc, null)
        .catch(assert.ifError)
        .then((result) => {
            assert(result.doc);
            assert.strictEqual(result.isNew, false);
            done();
        });
    });

    it('should returns the document found, using the exec() method', function(done) {
        const doc = {name: "Conan"};

        TestModel.findOrCreate(doc, null)
        .exec((err, result) => {
            assert.ifError(err);
            assert(result.doc);
            assert.strictEqual(result.isNew, false);
            done();
        });
    });

    it('should returns the document found, only selecting the "age" field', function(done) {
        const doc = {name: "Conan"};

        TestModel.findOrCreate(doc, null, {fields: "age"}, (err, result) => {
            assert.ifError(err);
            assert.ifError(result.doc.name);
            assert.strictEqual(result.isNew, false);
            done();
        });
    });

    it('should returns the new created document', function(done) {
        const doc = {name: "Barbarus"};

        TestModel.findOrCreate(doc, doc, (err, result) => {
            assert.ifError(err);
            assert.equal(result.doc.name, "Barbarus");
            assert.strictEqual(result.isNew, true);
            done();
        });
    });
});


/* Upserting tests */
describe("Find or create with upserting", function() {
    it('should returns the document found and updated', function(done) {
        const query = {name: "Conan"};
        const doc = {name: "Marcus"};

        TestModel.findOrCreate(query, doc, {upsert: true}, (err, result) => {
            assert.ifError(err);
            assert.equal(result.doc.name, "Marcus");
            assert.strictEqual(result.isNew, false);
            done();
        });
    });

    it('should creates a new document', function(done) {
        const doc = {name: "Marcus"};

        TestModel.findOrCreate(doc, doc, {upsert: true}, (err, result) => {
            assert.ifError(err);
            assert(result.doc);
            assert.strictEqual(result.isNew, true);
            done();
        });
    });

    it('should creates a new document and use the query projection option', function(done) {
        const doc = {name: "Marcus", age: 17};
        const options = {
            upsert: true,
            fields: "age"
        };

        TestModel.findOrCreate(doc, doc, options, (err, result) => {
            assert.ifError(err);
            assert.ifError(result.doc.name);
            assert.strictEqual(result.isNew, true);
            done();
        });
    });

    it('should updates a document, but returning the old record', function(done) {
        const query = {name: "Conan"};
        const doc = {name: "Marcus"};
        const options = {
            upsert: true,
            new: false
        };

        TestModel.findOrCreate(query, doc, options, (err, result) => {
            assert.ifError(err);
            assert.equal(result.doc.name, "Conan");
            assert.strictEqual(result.isNew, false);
            done();
        });
    });
});
