/** MONGOOSE FIND OR CREATE (WITH OPTIONAL UPSERT) SCHEMA PLUGIN
 *
 * @author: Manuel Di Iorio
 * @license: MIT
 **/

/**
 * @param Object query: The mongoose query to execute on the model
 * @param Object doc: The document to create/update
 * @param {optional} Object options: Contextual options object. Please see README.md for further details
 * @param {Optional} Function callback
 *
 * @return: a Promise when a callback is not found. You can also use the .exec(cb) method like any mongoose query.
 */

module.exports = function(query, doc, options, callback) {
    const self = this;

    if (arguments.length < 2)
        throw new Error("find-or-create requires at least the 'query' and 'doc' arguments")

    if (!callback && options instanceof Function) {
        callback = options;
        options = undefined;
    }

    // When upsert is specified, atomically find and upsert the doc
    const fn = (next) => {
        // Wrap the document when not upserting. The document will only be set on inserts
        if (!options || !options.upsert) doc = {"$setOnInsert": doc};

        // Merge the custom options with the default settings
        options = Object.assign({
            new: true,
            setDefaultsOnInsert: true
        }, options);

        options.passRawResult = true;
        options.upsert = true;

        // Execute the atomic query
        self.findOneAndUpdate(query, doc, options, (err, record, raw) => {
            if (err) return next(err);

            next(null, {
                doc: record,
                isNew: !raw.lastErrorObject.updatedExisting
            });
        });
    };

    // Execute the query and call the callback, eventually returning a promise
    if (callback) return fn(callback);

    const promise = new Promise((resolve, reject) => {
        fn((err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });

    promise.exec = fn;
    return promise;
};
