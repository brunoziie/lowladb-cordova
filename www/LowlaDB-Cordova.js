var exec = require('cordova/exec');

(function (module) {
  module.exports = LowlaDB;

  LowlaDB.prototype.close = close;
  LowlaDB.prototype.collection = collection;
  LowlaDB.prototype.db = db;

  // Private API
  LowlaDB._defaultOptions = {};

  function LowlaDB(options) {
    if (!(this instanceof LowlaDB)) {
      return new LowlaDB(options);
    }
  
    var config = this.config = {};
    LowlaDB.utils.keys(LowlaDB._defaultOptions).forEach(function (key) {
      config[key] = LowlaDB._defaultOptions[key];
    });
    LowlaDB.utils.keys(options).forEach(function (key) {
      config[key] = options[key];
    });

    this.events = {};
    this.liveCursors = {};  
  }

  function db(dbName) {
    return new LowlaDB.DB(this, dbName);
  }

  function collection(dbName, collectionName) {
    /* jshint validthis: true */
    return new LowlaDB.Collection(this, dbName, collectionName);
  }

  function close() {
  }
})(module);

// DB
(function (LowlaDB) {
  LowlaDB.DB = DB;
  DB.prototype.collection = collection;
  DB.prototype.collectionNames = collectionNames;
  DB.prototype.dropDatabase = dropDatabase;

  function DB(lowla, dbName) {
    this.name = dbName;
  }

  function collection(collectionName) {
    return new LowlaDB.Collection(this.name, collectionName);
  }

  function collectionNames() {
    var db = this;
  
    var collection, options, callback;
    var args = Array.prototype.slice.call(arguments, 0);
    while (args.length > 0) {
      var arg = args.pop();
      if (arg instanceof Function) {
        callback = arg;
      }
      else if (typeof(arg) === 'string') {
        collection = arg;
      }
      else if (typeof(arg) === 'object') {
        options = arg;
      }
    }
  
    options = options || {namesOnly:false};
    collection = collection || '';
  
    return new Promise(fetchNames)
      .then(applyOptions)
      .then(okCallback, errCallback);
    /////////////////////////////////
    
    function fetchNames(resolve, reject) {
      var successCallback = function (val) {resolve(val);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'db_collectionNames', [db.name]);
    }
  
    function applyOptions(data) {
      var answer = [];
      for (var i = 0 ; i < data.length ; ++i) {
        var dbCollName = data[i];
        if (!collection || dbCollName.indexOf(collection) === 0) {
          dbCollName = db.name + "." + dbCollName;
          if (options.namesOnly) {
            answer.push(dbCollName);
          }
          else {
            answer.push({name:dbCollName});
          }
        }
      }
      return answer;
    }
  
    function okCallback(answer) {
      if (callback) {
        callback(undefined, answer);
      }
      return answer;
    }
  
    function errCallback(err) {
      if (callback) {
        callback(err);
      }
      throw err;
    }
  }
  
  function dropDatabase(callback) {
     var db = this;
     return new Promise(function(resolve, reject) {
       var successCallback = function () {resolve();};
       var failureCallback = function (err) {reject(err);};
       exec(successCallback, failureCallback, 'LowlaDB', 'db_dropDatabase', [db.name]);
     })
      .then(function () {
        if (callback) {
          callback(null);
        }
     })
      .catch(function (e) {
        if (callback) {
          callback(e);
        }
        throw e;
       });
  }
})(module.exports);

// Collection
(function(LowlaDB) {
  LowlaDB.Collection = Collection;

  Collection.prototype.count = count;
  Collection.prototype.find = find;
  Collection.prototype.findOne = findOne;
  Collection.prototype.insert = insert;
  
  function Collection(lowla, dbName, collectionName) {
    this.dbName = dbName;
    this.collectionName = collectionName;
    this.lowla = lowla;
  }
  
  function find(filter) {
    /*jshint validthis:true */
    return LowlaDB.Cursor(this, filter);
  }
 
  function findOne(filter, callback) {
    /*jshint validthis:true */
    var coll = this;
    return this.find(filter).limit(1).toArray()
      .then(function (arr) {
        var obj = (arr && arr.length > 0) ? arr[0] : undefined;
        if (callback) {
          callback(null, obj);
        }
        return obj;
      }, function (err) {
        if (callback) {
          callback(err);
        }
        throw err;
      });
  }
 
  function insert(arg, callback) {
    /*jshint validthis:true */
    var coll = this;
    return new Promise(function(resolve, reject) {
      var successCallback = function () {resolve();};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'collection_insert', [coll.dbName, coll.collectionName, arg]);
    })
      .then(function() {
        var savedDoc; // Do we need this?
        if (callback) {
          callback(null, savedDoc);
        }
        return savedDoc;
      })
      .catch(function(e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
  
  function count(query, callback) {
    /*jshint validthis:true */
    if (typeof(query) === 'function') {
      callback = query;
      query = {};
    }

    return this.find(query).count(callback);
  }
  
})(module.exports);

// Cursor
(function (LowlaDB) {
  'use strict';

  // Public API
  LowlaDB.Cursor = Cursor;

  Cursor.prototype.count = count;
  Cursor.prototype.each = each;
  Cursor.prototype.limit = limit;
  Cursor.prototype.sort = sort;
  Cursor.prototype.showPending = showPending;
  Cursor.prototype.toArray = toArray;

  Cursor.prototype.on = on;
  Cursor.notifyLive = notifyLive;
  Cursor.prototype.cloneWithOptions = cloneWithOptions;

  ///////////////

  function Cursor(collection, filter, options) {
    if (!(this instanceof Cursor)) {
      return new Cursor(collection, filter, options);
    }

    this._lowla = collection.lowla;
    this._collection = collection;
    this._filter = filter;
    this._options = {
      sort: null,
      limit: 0,
      showPending: false
    };

    for (var i in options) {
      if (options.hasOwnProperty(i)) {
        this._options[i] = options[i];
      }
    }
  }

  function notifyLive(coll) {
    var key = coll.dbName + '.' + coll.collectionName;
    if (!coll.lowla.liveCursors[key]) {
      return;
    }

    coll.lowla.liveCursors[key].forEach(function (watcher) {
      watcher.callback(null, watcher.cursor);
    });
  }

  function on(callback) {
    /* jshint validthis:true */
    var coll = this._collection;
    var key = coll.dbName + '.' + coll.collectionName;
    if (!coll.lowla.liveCursors[key]) {
      coll.lowla.liveCursors[key] = [];
    }

    coll.lowla.liveCursors[key].push({cursor: this, callback: callback});
    callback(null, this);
  }

  function cloneWithOptions(options) {
    /* jshint validthis:true */
    var answer = new Cursor(this._collection, this._filter);
    answer._options = this._options;
    for (var i in options) {
      if (options.hasOwnProperty(i)) {
        answer._options[i] = options[i];
      }
    }

    return answer;
  }

  function limit(amount) {
    /* jshint validthis:true */
    return this.cloneWithOptions({limit: amount});
  }

  function sort(keyOrList) {
    /* jshint validthis:true */
    return this.cloneWithOptions({sort: keyOrList});
  }

  function showPending() {
    /* jshint validthis:true */
    return this.cloneWithOptions({showPending: true});
  }

  function each(callback) {
    /* jshint validthis:true */
    var cursor = this;
 
    if (!callback) {
      return;
    }
 
    return new Promise(function(resolve, reject) {
      var successCallback = function (doc) {
        if (doc) {
          callback(null, JSON.parse(doc));
        }
        else {
          resolve();
        }
      };
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'cursor_each', [cursor]);
    })
      .catch(function (err) {
        callback(err);
      });
  }
               
  function toArray(callback) {
    /* jshint validthis:true */
    var cursor = this;
              
    var answer = [];
    return this.each(function (err, doc) {
      if (err) {
        if (callback) {
          callback(err);
        }
        throw err;
      }
      answer.push(doc);
    })
      .then(function () {
        if (callback) {
          callback(null, answer);
        }
        return answer;
      });
  }

  function count(applySkipLimit, callback) {
    /* jshint validthis:true */
    if (typeof(applySkipLimit) === 'function') {
      callback = applySkipLimit;
      applySkipLimit = false;
    }

    var cursor = this;
    if (!applySkipLimit) {
      cursor = this.cloneWithOptions({skip: 0, limit: 0});
    }

    return new Promise(function(resolve, reject) {
      var successCallback = function (count) {resolve(count);};
      var failureCallback = function (err) {reject(err);};
      exec(successCallback, failureCallback, 'LowlaDB', 'cursor_count', [cursor]);
    })
      .then(function(count) {
        if (callback) {
          callback(null, count);
        }
        return count;
      })
      .catch(function(e) {
        if (callback) {
          callback(e);
        }
        throw e;
      });
  }
})(module.exports);

// Utils
(function (LowlaDB) {
  LowlaDB.utils = {};
  LowlaDB.utils.keys = function(obj) {
    if (!obj) {
      return [];
    }

    if (Object.keys) {
      return Object.keys(obj);
    }

    var answer = [];
    for (var i in obj) {
      if (obj.hasOwnProperty(i)) {
        answer.push(i);
      }
    }

    return answer;
  };
})(module.exports);
