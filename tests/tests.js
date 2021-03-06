exports.defineAutoTests = function() {
  
  describe('LowlaDB (Cordova)', function (done) {
    var spec = new JasmineThen.Spec(this);

    spec.beforeEach(function () {
      window.lowla = new LowlaDB();
    });
    
    spec.afterEach(function () {
      lowla.close();
    });
    
    describe('Events', function(done) {
      var spec = new JasmineThen.Spec(this);

      spec.it('can register and receive a single event', function () {
        var cb = jasmine.createSpy('cb');
        lowla.on('myEvent', cb);
        lowla.emit('myEvent');
        expect(cb.calls.count()).toEqual(1);
        lowla.emit('myEvent');
        expect(cb.calls.count()).toEqual(2);
      });

      spec.it('can register multiple listeners to one event', function () {
        var cb1 = jasmine.createSpy('cb1');
        var cb2 = jasmine.createSpy('cb2');
        lowla.on('myEvent', cb1);
        lowla.on('myEvent', cb2);
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(1);
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(2);
        expect(cb2.calls.count()).toEqual(2);
      });

      spec.it('can register multiple events', function () {
        var cb1 = jasmine.createSpy('cb1');
        var cb2 = jasmine.createSpy('cb2');
        lowla.on('myEvent', cb1);
        lowla.on('myEvent2', cb2);
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(0);
        lowla.emit('myEvent2');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(1);
      });

      spec.it('can remove a listener from an event', function () {
        var cb1 = jasmine.createSpy('cb1');
        var cb2 = jasmine.createSpy('cb2');
        lowla.on('myEvent', cb1);
        lowla.on('myEvent', cb2);
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(1);
        lowla.off('myEvent', cb1);
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(2);
      });

      spec.it('can remove all listeners from an event', function () {
        var cb1 = jasmine.createSpy('cb1');
        var cb2 = jasmine.createSpy('cb2');
        var cb3 = jasmine.createSpy('cb3');
        lowla.on('myEvent', cb1);
        lowla.on('myEvent', cb2);
        lowla.on('myEvent3', cb3);
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(1);
        expect(cb3.calls.count()).toEqual(0);
        lowla.emit('myEvent3');
        expect(cb3.calls.count()).toEqual(1);
        lowla.off('myEvent');
        lowla.emit('myEvent');
        expect(cb1.calls.count()).toEqual(1);
        expect(cb2.calls.count()).toEqual(1);
        expect(cb3.calls.count()).toEqual(1);
        lowla.emit('myEvent3');
        expect(cb3.calls.count()).toEqual(2);
      });
    });
  });
  
  describe('LowlaDB DB (Cordova)', function (done) {
    var spec = new JasmineThen.Spec(this);

    spec.beforeEach(function () {
      window.lowla = new LowlaDB();
    });
    
    spec.afterEach(function () {
      lowla.close();
    });
    
    spec.it('should create DB objects', function () {
      var theDB = lowla.db('dbName');
      expect(theDB).toBeDefined();
    });

    spec.it('can create collections', function () {
      var theDB = lowla.db('dbName');
      var theColl = theDB.collection('TestCollection');
      expect(theColl).toBeDefined();
    });

    describe('.collectionNames', function (done) {
      var spec = new JasmineThen.Spec(this);
      
      var theDB, coll, collTwo;
      spec.beforeEach(function () {
        theDB = lowla.db('dbName');
        return theDB.dropDatabase()
          .then(function () {
            coll = lowla.collection('dbName', 'collectionOne');
            collTwo = lowla.collection('dbName', 'collectionTwo');
            return Promise.all([coll.insert({a: 1}), collTwo.insert({b: 2})]);
          });
      });

      spec.it('can retrieve all collection names', function () {
        return theDB.collectionNames().then(function (names) {
          expect(names.length).toEqual(2);
          names.sort(function (a, b) { return a.name.localeCompare(b.name); });
          expect(names[0].name).toEqual('dbName.collectionOne');
          expect(names[1].name).toEqual('dbName.collectionTwo');
        });
      });

      spec.it('can retrieve a specific collection name', function () {
        return theDB.collectionNames('collectionOne').then(function (names) {
          expect(names.length).toEqual(1);
          expect(names[0].name).toEqual('dbName.collectionOne');
        });
      });

      spec.it('can return only the collection names', function () {
        return theDB.collectionNames({namesOnly: true}).then(function (names) {
          expect(names.length).toEqual(2);
          names.sort();
          expect(names[0]).toEqual('dbName.collectionOne');
          expect(names[1]).toEqual('dbName.collectionTwo');
        });
      });

      spec.it('can return names via callback', function () {
        return theDB.collectionNames(function (err, names) {
          expect(err).toBeUndefined();
          expect(names.length).toEqual(2);
        });
      });
    });
  });
  
  describe('LowlaDB Collection (Cordova)', function (done) {
    var spec = new JasmineThen.Spec(this);

    spec.beforeEach(function () {
      window.lowla = new LowlaDB();
      theDB = lowla.db('dbName');
      return theDB.dropDatabase();
    });
    
    spec.afterEach(function () {
      lowla.close();
    });

    describe('count()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can count the documents in a collection', function () {
        var coll = lowla.collection('dbName', 'TestColl');
        return coll
          .insert([{a: 1}, {a: 2}, {a: 3}])
          .then(function () {
            return coll.count();
          })
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.count({a: 2});
          })
          .then(function (count) {
            expect(count).toEqual(1);
            return coll.count({});
          })
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.count({z: 5});
          })
          .then(function (count) {
            expect(count).toEqual(0);
          })
          .then(function () {
            return coll.count(function (err, count) {
              expect(err).toBeNull();
              expect(count).toEqual(3);
            });
          });
      });
    });
    
    describe('insert()', function () {
      var spec = new JasmineThen.Spec(this);
      /*
      spec.it('can insert documents using a custom lowlaId generator', function (done) {
        lowla.close();
        lowla = new LowlaDB({datastore: dsName, lowlaId: ssnIdGenerator});
        var coll = lowla.collection('dbName', 'CollName');
        var doc = {ssn: '020-43-9853'};

        coll
          .insert(doc)
          .then(function () {
            lowla.datastore.loadDocument('dbName.CollName', doc.ssn, testUtils.cb(done, function (foundDoc) {
              should.exist(foundDoc);
              foundDoc.ssn.should.equal(doc.ssn);
            }));
          })
          .then(null, done);

        function ssnIdGenerator(coll, doc) {
          return doc.ssn;
        }
      });
      */

      spec.it('can create documents', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert({a: 1})
          .then(function (doc) {
            expect(doc).not.toBeNull();
            expect(doc._id).toBeDefined();
            expect(doc.a).toEqual(1);
          })
          .then(function () {
            return coll.insert({b: 2}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc).not.toBeNull();
              expect(doc.b).toEqual(2);
            });
          })
      });

      spec.it('can insert multiple documents at once', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert([{a: 1}, {b: 2}])
          .then(function (docs) {
            expect(docs instanceof Array).toBe(true);
            expect(docs.length).toEqual(2);
            expect(docs[0].a).toEqual(1);
            expect(docs[1].b).toEqual(2);
            expect(docs._id).toBeUndefined();
            expect(docs[0]._id).toBeDefined();
            expect(docs[1]._id).toBeDefined();
          })
          .then(function () {
            return coll.insert([{c: 3}, {d: 4}], function (err, docs) {
              expect(err).toBeNull();
              expect(docs instanceof Array).toBe(true);
              expect(docs.length).toEqual(2);
              expect(docs[0].c).toEqual(3);
              expect(docs[1].d).toEqual(4);
              expect(docs._id).toBeUndefined();
              expect(docs[0]._id).toBeDefined();
              expect(docs[1]._id).toBeDefined();
            });
          })
      });

      spec.it('prevents inserting $field names', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert({$field: 1})
          .then(function (docs) {
            expect(docs).toBeUndefined(); // Shouldn't reach here
          }, function (err) {
            expect(err).toBeDefined();
            expect(err).toMatch(/\$field/);
          })
          .then(function () {
            return coll.insert({$field2: 1}, function (err, doc) {
              expect(err).toBeDefined();
              expect(doc).toBeUndefined();
              expect(err).toMatch(/\$field/);
            });
          })
          .catch(function () {
          });
      });
    });
    
    describe('find()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('with no documents in datastore works without error', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.find({}).toArray()
          .then(function (docs) {
            expect(docs).not.toBeNull();
            expect(docs.length).toEqual(0);
          })
          .then(function () {
            return coll.find({}).toArray(function (err, docs) {
              expect(err).toBeNull();
              expect(docs).not.toBeNull();
              expect(docs.length).toEqual(0);
            });
         });
      });

      spec.it('with no matching documents works without error', function () {
        var coll = lowla.collection('dbName', 'CollName');
          return coll.insert([{a: 1}, {b: 2}])
          .then(function () {
            return coll.find({a: 2}).toArray();
          })
          .then(function (docs) {
            expect(docs).not.toBeNull();
            expect(docs.length).toEqual(0);
          })
          .then(function () {
            return coll.find({a: 2}).toArray(function (err, docs) {
              expect(err).toBeNull();
              expect(docs).not.toBeNull();
              expect(docs.length).toEqual(0);
            });
          });
      });
      
      spec.it('finds multiple documents', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert([{a: 1}, {b: 2}, {c: 3}, {d: 4}])
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (docs) {
            expect(docs.length).toEqual(4);
            expect(docs[0].a).toEqual(1);
            expect(docs[1].b).toEqual(2);
            expect(docs[2].c).toEqual(3);
            expect(docs[3].d).toEqual(4);
          })
      });
             
      spec.it('finds a single document among many', function () {
        var coll = lowla.collection('dbName', 'CollName');
        return coll.insert([{a: 1}, {b: 2}, {c: 3}, {d: 4}])
          .then(function () {
            return coll.find({c: 3}).toArray();
          })
          .then(function (docs) {
            expect(docs.length).toEqual(1);
            expect(docs[0].c).toEqual(3);
          })
          .then(function () {
            return coll.find({d: 4}).toArray(function (err, docs) {
              expect(err).toBeNull();
              expect(docs).not.toBeNull();
              expect(docs.length).toEqual(1);
              expect(docs[0].d).toEqual(4);
            });
          });
      });

      spec.it('only retrieves documents from the given collection', function () {
        var coll = lowla.collection('dbName', 'One');
        var collTwo = lowla.collection('dbName', 'Two');
        return coll.insert({a: 1})
          .then(function () {
            return collTwo.insert({a: 2});
          })
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr).not.toBeNull();
            expect(arr.length).toEqual(1);
            expect(arr[0].a).toEqual(1);
          });
      });
    });

    describe('findOne()', function () {
      var spec = new JasmineThen.Spec(this);
      
      var coll;
      spec.beforeEach(function () {
        coll = lowla.collection('dbName', 'CollName');
      });

      spec.it('finds nothing without error', function () {
        return coll.findOne({a: 1})
          .then(function (doc) {
            expect(doc).toBeUndefined();
          })
          .then(function () {
            return coll.findOne({a: 2}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc).toBeUndefined();
            });
          })
      });

      spec.it('finds a single document', function () {
        return coll.insert({a: 1})
          .then(function () {
            return coll.findOne({a: 1});
          })
          .then(function (doc) {
            expect(doc).not.toBeNull();
            expect(doc.a).toEqual(1);
          })
          .then(function () {
            return coll.findOne({a: 1}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc.a).toEqual(1);
            });
          })
      });

      spec.it('finds a single document when many match', function (done) {
        return coll.insert([{a: 1, b: 2}, {a: 1, b: 3}, {a: 1, b: 4}])
          .then(function () {
            return coll.findOne({a: 1});
          })
          .then(function (doc) {
            expect(doc).not.toBeNull();
            expect(doc.a).toEqual(1);
          })
          .then(function () {
            return coll.findOne({a: 1}, function (err, doc) {
              expect(err).toBeNull();
              expect(doc.a).toEqual(1);
              expect(doc.b).not.toBeNull();
            });
          })
      });
    });
    
    describe('findAndModify()', function () {
      var spec = new JasmineThen.Spec(this);
      var coll;

      spec.beforeEach(function () {
        coll = lowla.collection('dbName', 'CollName');
      });

      spec.it('can find and modify a document', function () {
        return coll.insert([{a: 1}, {b: 2}, {c: 3}])
          .then(function () {
            return coll.findAndModify({a: 1}, {$set: {a: 2}});
          })
          .then(function (newObj) {
            expect(newObj.a).toEqual(2);
          })
          .then(function () {
            return coll.findAndModify({a: 2}, {$set: {a: 3}}, function (err, newObj) {
              expect(err).toBeNull();
              expect(newObj.a).toEqual(3);
            });
          })
      });

      spec.it('supports $unset operations', function () {
        return coll.insert({a: 1, b: 2, c: 3})
          .then(function () {
            return coll.findAndModify({a: 1}, {$unset: {b: ''}});
          })
          .then(function (obj) {
            expect(obj.a).toEqual(1);
            expect(obj.c).toEqual(3);
            expect(obj.b).toBeUndefined();

            // Shouldn't matter if the field isn't present
            return coll.findAndModify({a: 1}, {$unset: {notThere: ''}});
          })
          .then(function (obj) {
            expect(obj.a).toEqual(1);
            expect(obj.c).toEqual(3);
            expect(obj.b).toBeUndefined();
            expect(obj.notThere).toBeUndefined();
          });
      });

      spec.it('does not modify other documents when filter finds no documents', function () {
        return coll.insert([{a: 1}, {a: 2}, {a: 3}])
          .then(function () {
            return coll.findAndModify({x: 22}, {$set: {b: 2}});
          })
          .then(function () {
            return coll.find({}).sort('a').toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[0].b).toBeUndefined();
            expect(arr[1].b).toBeUndefined();
            expect(arr[2].b).toBeUndefined();
          });
      });

      spec.it('preserves existing ids when performing full document updates', function () {
        var docId;
        return coll.insert({a: 1})
          .then(function (doc) {
            docId = doc._id;
            return coll.findAndModify({a: 1}, {a: 2, b: 3});
          })
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(1);
            expect(arr[0]._id).toEqual(docId);
          });
      });

      spec.it('can find and modify the correct document among many documents', function () {
        var id2;
        return coll.insert([{a: 1}, {a: 2}, {a: 3}])
          .then(function (arr) {
            expect(arr[1].a).toEqual(2);
            id2 = arr[1]._id;
            expect(arr.length).toEqual(3);
            return coll.findAndModify({a: 2}, {$set: {a: 5}});
          })
          .then(function () {
            return coll.find({_id: id2}).toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(1);
            expect(arr[0].a).toEqual(5);
          });
      });

      spec.it('prevents replacement updates with $field names', function () {
        return coll.insert({a: 1})
          .then(function (obj) {
            return coll.findAndModify({_id: obj._id}, {$badField: 2});
          })
          .then(function (obj) {
            expect(obj).toBeNull(); // Shouldn't get here
          }, function (err) {
            expect(err).toBeDefined();
            expect(err).toMatch(/\$badField/);
          })
          .then(function () {
            return coll.findAndModify({a: 1}, {$badField2: 2}, function (err, obj) {
              expect(obj).toBeUndefined();
              expect(err).toMatch(/\$badField2/);
            });
          })
          .catch(function () {
          });
      });

      spec.it('prevents update operations on $field names', function () {
        return coll.insert({a: 1})
          .then(function (obj) {
            return coll.findAndModify({_id: obj._id}, {$set: {$badName: 3}});
          })
          .then(function (obj) {
            expect(obj).toBeNull(); // Shouldn't get here
          }, function (err) {
            expect(err).toBeDefined();
            expect(err).toMatch(/\$badName/);
          })
          .then(function () {
            return coll.findAndModify({a: 1}, {$set: {$badName2: 3}}, function (err, obj) {
              expect(obj).toBeUndefined();
              expect(err).toMatch(/\$badName2/);
            });
          })
          .catch(function () {
          });
      });

      spec.it('prevents mixing operations with fields', function () {
        return coll.insert({a: 1})
          .then(function () {
            return coll.findAndModify({a: 1}, {$set: {b: 2}, c: 3});
          })
          .then(function (obj) {
            expect(obj).toBeNull(); // Shouldn't get here
          }, function(err) {
            expect(err).toBeDefined();
            expect(err).toMatch(/Can not mix/);
          })
          .then(function () {
            return coll.findAndModify({a: 1}, {$set: {b: 3}, c: 4}, function (err, obj) {
              expect(obj).toBeUndefined();
              expect(err).toMatch(/Can not mix/);
            });
          })
          .catch(function () {
          });
      });
    });
    
    describe('remove()', function () {
      var spec = new JasmineThen.Spec(this);
      
      var coll;
      spec.beforeEach(function () {
        coll = lowla.collection('dbName', 'CollName');

        var theDB = lowla.db('dbName');
        return theDB.dropDatabase();
      });

      spec.it('can remove a document', function () {
        return coll
          .insert([{a: 1}, {a: 2}, {a: 3}])
          .then(function () {
            return coll.remove({a: 2});
          })
          .then(function (count) {
            expect(count).toEqual(1);
            return coll.find({}).sort('a').toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(2);
            expect(arr[0].a).toEqual(1);
            expect(arr[1].a).toEqual(3);
          })
          .then(function () {
            return coll.remove({a: 3}, function (err, count) {
              expect(err).toBeNull();
              expect(count).toEqual(1);
            });
          })
      });

      spec.it('can remove zero documents', function () {
        return coll
          .insert([{a: 1}, {b: 2}, {c: 3}])
          .then(function () {
            return coll.remove({d: 4});
          })
          .then(function (count) {
            expect(count).toEqual(0);
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(3);
          });
      });

      spec.it('can remove all documents', function () {
        return coll
          .insert([{a: 1}, {b: 2}, {c: 3}])
          .then(function () {
            return coll.remove();
          })
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(0);
          });
      });

      spec.it('works with only callback argument', function () {
        return coll
          .insert([{a: 1}, {a: 2}])
          .then(function () {
            return coll.remove(function (err, count) {
              expect(err).toBeNull();
              expect(count).toEqual(2);
            });
          });
      });
    });
  });
  
  describe('LowlaDB Cursor (Cordova)', function (done) {  
    var spec = new JasmineThen.Spec(this);
    
    var coll, coll2;
    spec.beforeEach(function () {      
      coll = lowla.collection('dbName', 'TestColl');
      coll2 = lowla.collection('dbName', 'OtherColl');

      var theDB = lowla.db('dbName');
      return theDB.dropDatabase()
        .then(function () {
          return Promise.all([
            coll.insert([{a: 1}, {a: 2}, {a: 3}]),
            coll2.insert([{b: 7, c: 'a', x: 1, s: 5}, {b: 12, c: 'q', y: 2, s: 5}, {b: 3, c: 'f', z: 3, s: 5}])
          ]);
        });
    });
    
    describe('Constructor', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('sets default options', function () {
        var check = new LowlaDB.Cursor(coll, {});
        expect(check._options.sort).toBeNull();
        expect(check._options.limit).toEqual(0);
        expect(check._options.showPending).toBe(false);
      });

      spec.it('merges provided options with defaults', function () {
        var check = new LowlaDB.Cursor(coll, {}, {limit: 10});
        expect(check._options.sort).toBeNull();
        expect(check._options.limit).toEqual(10);
        expect(check._options.showPending).toBe(false);
      });
    });

    describe('toArray()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can handle circular references in the cursor object', function () {
        var cursor = coll.find({});
        lowla.extraProp = lowla;
        return cursor.toArray()
          .then(function () {
            return coll.count();
          })
          .then(function () {
            delete lowla.extraProp;
          })
          .catch(function(err) {
            delete lowla.extraProp;
            throw err;
          });
      });

      spec.it('can find no matching documents', function () {
        var cursor = coll.find({z: 1});
        cursor
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(0);
            return cursor.toArray(function (err, arr) {
              expect(err).toBeNull();
              expect(arr.length).toEqual(0);
            });
          });
      });

      spec.it('only finds documents in the correct collection', function () {
        return coll
          .find()
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[0].a).toBeDefined();
            expect(arr[1].a).toBeDefined();
            expect(arr[2].a).toBeDefined();
          });
      });
    });

    describe('each()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can enumerate documents', function () {
        var docs = [];
        return coll.find().each(function (err, doc) {
          docs.push(doc);
        })
          .then(function () {
            expect(docs.length).toEqual(3);
            expect(docs[0].a).toEqual(1);
            expect(docs[1].a).toEqual(2);
            expect(docs[2].a).toEqual(3);
          });
      });

      spec.it('does nothing with no callback', function () {
        coll.find().each();
      });
    });
    
    describe('sort()', function () {
      var spec = new JasmineThen.Spec(this);

      spec.it('can sort numbers', function () {
        return coll2
          .find()
          .sort('b')
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[0].b).toEqual(3);
            expect(arr[1].b).toEqual(7);
            expect(arr[2].b).toEqual(12);
          });
      });
             
      spec.it('can sort text', function () {
        return coll2
          .find()
          .sort('c')
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[0].c).toEqual('a');
            expect(arr[1].c).toEqual('f');
            expect(arr[2].c).toEqual('q');
          });
      });
             
      spec.it('can sort in descending order', function () {
        return coll2
          .find()
          .sort([['b', -1]])
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[0].b).toEqual(12);
            expect(arr[1].b).toEqual(7);
            expect(arr[2].b).toEqual(3);
          });
      });
             
      spec.it('can sort documents without the sort criteria', function () {
        return coll2
          .find()
          .sort('x')
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[2].x).toEqual(1);
                  
            return coll2
              .find()
              .sort('y')
              .toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[2].y).toEqual(2);
          });
      });
             
      spec.it('can sort documents with the same sort value', function () {
        return coll2
          .find()
          .sort([['s', 1], 'b'])
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(3);
            expect(arr[0].b).toEqual(3);
            expect(arr[1].b).toEqual(7);
            expect(arr[2].b).toEqual(12);
          });
      });
    });
    
    describe('limit()', function () {
      var spec = new JasmineThen.Spec(this);

      spec.it('can limit sorted documents', function () {
        return coll
          .find({})
          .sort('a')
          .limit(2)
          .toArray()
          .then(function (arr) {
            expect(arr.length).toEqual(2);
            expect(arr[0].a).toEqual(1);
            expect(arr[1].a).toEqual(2);
                    
            return coll.find({}).limit(1).sort([['a', -1]]).toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(1);
            expect(arr[0].a).toEqual(3);
          });
      });
    });
    
    describe('showPending()', function () {
      var spec = new JasmineThen.Spec(this);

      spec.it('sets modified documents as pending sync', function () {
        return coll
          .find()
          .showPending()
          .toArray()
          .then(function (arr) {
            expect(arr).toBeDefined();
            expect(arr.length).toEqual(3);
            expect(arr[0].$pending).toBe(true);
            expect(arr[1].$pending).toBe(true);
            expect(arr[2].$pending).toBe(true);
          });
      });
    });
    
    describe('count()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can count the documents', function () {
        return coll
          .find()
          .count()
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.find({a: 2}).count();
          })
          .then(function (count) {
            expect(count).toEqual(1);
            return coll.find({}).limit(2).count(true);
          })
          .then(function (count) {
            expect(count).toEqual(2);
            return coll.find().limit(20).count(true);
          })
          .then(function (count) {
            expect(count).toEqual(3);
            return coll.find().limit(2).count(false);
          })
          .then(function (count) {
            expect(count).toEqual(3);
          });
      });

      spec.it('provides count via callback', function () {
        return coll
          .find()
          .count(function (err, count) {
            expect(err).toBeNull();
            expect(count).toEqual(3);
          });
      });

      spec.it('supports both arguments to count', function () {
        return coll
          .find()
          .limit(2)
          .count(true, function (err, count) {
            expect(err).toBeNull();
            expect(count).toEqual(2);
          });
      });
    });
    
    describe('on()', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can watch for changes on collections', function () {
        var wrappedCallback = null;
        var offFn = null;

        var callback = function (err, cursor) {
          wrappedCallback(err, cursor);
        };

        return Promise.resolve()
          .then(function () {
            return new Promise(function (resolve, reject) {
              wrappedCallback = function (err, cursor) {
                cursor.toArray().then(function (arr) {
                  try {
                    expect(arr.length).toEqual(3);
                    resolve();
                  }
                  catch (err) {
                    reject(err);
                  }
                });
              };

              offFn = coll.find({}).sort('a').on(callback);
            });
          })
          .then(function () {
            return new Promise(function (resolve, reject) {
              wrappedCallback = function (err, cursor) {
                cursor.toArray().then(function (arr) {
                  try {
                    expect(arr.length).toEqual(3);
                    expect(arr[0].b).toEqual(5);
                    resolve();
                  }
                  catch (e) {
                    reject(e);
                  }
                });
              };

              coll.findAndModify({a: 1}, {$set: {b: 5}});
            });
          })
          .then(function () {
            return offFn();
          });
      });
      
      spec.it('can turn off a live cursor', function () {
        var wrappedCallback = null;
        var offFn = null;
        
        var callback = function (err, cursor) {
          wrappedCallback(err, cursor);
        };

        return new Promise(function (resolve, reject) {
          wrappedCallback = function (err, cursor) {
            resolve();
          };
          offFn = coll.find({}).sort('a').on(callback);
        })
          .then(function () {
            return new Promise(function (resolve, reject) {
              // You can't wait for a callback to not be called so instead wait 1/2 second -
              // if the callback is going to be called it should have happened by then.
              wrappedCallback = function(err, cursor) {
                reject("Callback should not have been called in cursor.off");
              };
              setTimeout(function () {resolve();}, 500);
              offFn();
            });
          })
          .then(function() {
            return new Promise(function (resolve, reject) {
              // You can't wait for a callback to not be called so instead wait 1/2 second -
              // if the callback is going to be called it should have happened by then.
              wrappedCallback = function(err, cursor) {
                reject("Callback should not have been called after cursor.off");
              };
              setTimeout(function () {resolve();}, 500);
              coll.findAndModify({a: 1}, {$set: {b: 5}});
            });
          });
      });
    });
  });
  
  describe('LowlaDB Sync (Cordova)', function (done) {
    var spec = new JasmineThen.Spec(this);

    var coll;
    
    var makeAdapterResponse = function () {
      var args = Array.prototype.slice.call(arguments);
      if (args[0] instanceof Array) {
        args = args[0];
      }

      var answer = [];
      args.map(function (obj) {
        var objId = obj._id;
        if (-1 === objId.indexOf('$')) {
          objId = 'dbName.collectionOne$' + objId;
        }
        answer.push({
          id: objId,
          clientNs: 'dbName.collectionOne',
          deleted: !!obj._deleted
        });
        if (!obj._deleted) {
          answer.push(obj);
        }
      });
      return answer;
    };

    spec.beforeEach(function () {
      window.lowla = new LowlaDB();
      var theDB = lowla.db('dbName');
      coll = lowla.collection('dbName', 'collectionOne');
      return theDB.dropDatabase();
    });
    
    spec.afterEach(function () {
      lowla.close();
    });
    
    describe('Sync', function () {
      var spec = new JasmineThen.Spec(this);

      spec.it('fails cleanly with a bad url', function () {
        var cbBegin = jasmine.createSpy('cbBegin');
        var cbEnd = jasmine.createSpy('cbEnd');

        lowla.on('syncBegin', cbBegin);
        lowla.on('syncEnd', cbEnd);

        return lowla.sync('http://localhost:3')
          .then(function () {
            expect(false).toBeTrue();
          })
          .catch(function (err) {
            expect(err).toBeDefined();
            expect(cbBegin.calls.count()).toEqual(1);
            expect(cbEnd.calls.count()).toEqual(1);
          });
      });
    });
    
    describe('Load', function () {
      var spec = new JasmineThen.Spec(this);
      
      spec.it('can load documents from an object', function () {
        var resp = makeAdapterResponse({_id: '1234', a: 1}, {_id: '2345', a: 2}, {_id: '3456', a: 3});
        return lowla.load({sequence: 5, documents: [resp]})
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(3);
          });
      });

      spec.it('can load many documents from a url', function () {
        var payload = {sequence: 22, documents: []};
        var docs = [];
        for (var i = 1; i <= 25; i++) {
          docs.push({_id: 'fakeId' + i, i: i});
          if (docs.length === 10) {
            payload.documents.push(makeAdapterResponse(docs));
            docs = [];
          }
        }
        if (docs.length) {
          payload.documents.push(makeAdapterResponse(docs));
        }

        expect(payload.documents[0].length).toEqual(20);
        expect(payload.documents[1].length).toEqual(20);
        expect(payload.documents[2].length).toEqual(10);

        spyOn(LowlaDB.utils, "getJSON").and.callFake(function() {
          return Promise.resolve(JSON.stringify(payload));
        });

        return lowla.load('http://lowla.io/my-data.json')
          .then(function () {
            return coll.find().toArray();
          })
          .then(function (arr) {
            expect(arr.length).toEqual(25);
          });
      });

      spec.it('invokes a given callback', function () {
        var resp = makeAdapterResponse({_id: '1234', a: 1}, {_id: '2345', a: 2}, {_id: '3456', a: 3});
        return lowla.load({sequence: 5, documents: [resp]}, function (err) {
          expect(err).toBeNull();
        });
      });

      spec.it('fails appropriately when URL is unavailable', function () {
        spyOn(LowlaDB.utils, "getJSON").and.callFake(function() {
          throw new Error('Invalid URL');
        });
              
        return lowla.load('http://lowla.io/my-data.json')
          .then(function () {
             expect(false).toBeTrue();
          }, function (err) {
             expect(err).toBeDefined();
             expect(err).toMatch(/Invalid URL/);
          })
          .then(function () {
            return lowla.load('http://lowla.io/my-data.json', function (err) {
              expect(err).toBeDefined();
              expect(err).toMatch(/Invalid URL/);
            });
          })
          .catch(function () {
          });
      });
    });
  });  
};
