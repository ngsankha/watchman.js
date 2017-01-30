// **Project maintained by [sankha93](https://github.com/sankha93) | View on [Github](https://github.com/sankha93/watchman.js) **
//
// A file watching API with a powerful expression parser.
//
// Inspired from [watchman by Facebook](https://github.com/facebook/watchman).
//
// ## Purpose
//
// Watchman.js exists to watch files and raise events when files change (or get deleted/added). It can trigger actions (such as recompiling files) by matching the expressions when the files change.
//
// ## Concepts
//
// Watchman.js can watch one or more files or directory trees. It matches the files that have changed against its corresponding expression. If the expression validates to be true the callback for that event is called.
//
// The expression has to be a valid JavaScript Array. It will have tokens which can be expressions themselves, thus allowing you to next expressions. For example, a valid expression would be:
//
// `['true']` or `['anyof', ['empty'], ['not', ['exists']]]`
//
// ## Using
//
// To use in your projects, just do:
//
//     npm install watchman.js
//
// Just import the module by:
//
//     var watchman = require("watchman.js");
//
// ## Example
//
// Here I will write a script that will generate the docs when the source file changes and it exists on disk and is not empty.
//
// ```
// var watchman = require('watchman.js');
// var spawn = require('child_process').spawn;
//
// function changeTrigger(file) {
//   spawn('docco', ['watchman.js']);
// }
// 
// watchman.watch('watchman.js', ["allof", ["not", ["empty"]], ["exists"]], {change: changeTrigger});
// ```
//
// ## Expressions
//
// A Watchman.js query expression consists of 1 or more terms. The expression is evaluated against the file and produces a boolean result. If that result is true then the file is considered a match and the corresponding callback is called.
//
// An expression term is canonically represented as a JSON array whose zeroth element is the string containing the term name.
//
//     ["termname", arg1, arg2, ...]
//
// The 'termname` can be any of the following:
//
// * `allof`: This evaluates to true if all the grouped expressions also evaluated as true. For example this will trigger callbacks only for files that are empty and exist:
//
//       ["allof", ["empty"], ["exists"]]
// Each array element after the term name is evaluated as an expression of its own.
//
//       ["allof", expr1, expr2, ...]
// Evaluation of the subexpressions stops at the first one that returns false.
// * `anyof`: This evaluates to true if any of the grouped expression evaluates to true. For example this will trigger callbacks only for files that empty or doesn't exist.
//
//       ['anyof', ['empty'], ['not', ['exists']]]
// Each array element after the term name is evaluated as an expression of its own.
//
//       ["allof", expr1, expr2, ...]
// Evaluation of the subexpressions stops at the first one that returns true.
// * `not`: This is inverts the result of the subexpression argument.
//
//       ["not", "empty"]
// * `true`: The true expression always evaluates as true.
//
//       ["true"]
// * `false`: The false expression always evaluates as false.
//
//       ["false"]
// * `suffix`: This evaluates to true if the file suffix matches the subexpression. This matches file `foo.php` and `foo.PHP` but not `foophp`.
//
//       ["suffix", "php"]
// * `regex`: This performs a full JavaScript Regex match against the full path of the file on which the event has been triggered. It evaluates to true if it matches, false otherwise. This will trigger callbacks for all files that ends in `t`.
//
//       ["regex", "/t$/"]
// * `iregex`: This performs a full JavaScript Regex match while ignoring the case against the full path of the file on which the event has been triggered. It evaluates to true if it matches, false otherwise. This will trigger callbacks for all files that ends in `t` or `T`.
//
//       ["regex", "/t$/"]
// * `name`: This evaluates to true if the name is exactly the same as the subexpression. For example, this will evaluate to true for test.txt.
//
//       ["name", "test.txt"]
// * `iname`: This evaluates to true if the name is same as the subexpression when the case is ignored. For example, this will evaluate to true for test.txt or TEST.txt or TEst.tXt.
//
//       ["iname", "test.txt"]
// * `empty`: This evaluates to true if the file is empty.
//
//       ["empty"]
// * `exists`: This evaluates to true if the file exists.
//
//       ["exists"]
// * `since`: This evaluates to true if the time property of the file is greater than the since (second in the expression) value. The time property needs to be specified as one of the filesystem metadata - `mtime`, `ctime`, `atime`.
//
//       ["since", 12345668, "mtime"]
//       ["since", 12345668, "ctime"]
//       ["since", 12345668, "atime"]
// * `type`: Evaluates as true if the typ of file matches by the second argument. This matches regular files:
//
//       ["type", "f"]
// Possible types are:
//
//   * `b`: block special file
//   * `c`: character special file
//   * `d`: directory
//   * `f`: regular file
//   * `p`: named pipe (FIFO)
//   * `l`: symbolic link
//   * `s`: socket
//
// ## Events
//
// There can be following event types for which the callbacks can be handled:
//
// * `add`: Fired when a file is added
// * `change`: Fired when a watched file is changed
// * `unlink`: Fired when a watched file is removed from disk
// * `error`: Fired when an error is encountered
//
// These can be passed as a callback object when watching a file. The object is defined as follows:
//
//     { add: function(file) {...},
//       change: function(file) {...},
//       unlink: function(file) {...},
//       error: function(file) {...}
//     }
// Then the function corresponding to the event will be called.
//
// ## Functions

var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");

var watchList = [];
var watchers = [];


// **watch**
//
// Function to start watching a file
//
// _Parameters:_
//
// * `file`: The file to watch
// * `expression`: A valid expression in the JavaScript Array form
// * `callback`: An object which can have the following named functions:
//   * `add`: Called when a file is added
//   * `change`: Called when a watched file is changed
//   * `unlink`: Called when a watched file is removed from disk
//   * `addDir`: Called when a watched directory is added to disk
//   * `unlinkDir`: Called when a watched directory is removed from disk
//   * `error`: Called when an error is encountered
//
// Any function in the callback object takes a an argument `file` which is the file that has been changed/created/deleted.

var watch = function(file, expression, callback) {
    var obj = { file: file,
                expression: expression,
                callback: callback };
    watchList.push(obj);
    var watcher = chokidar.watch(obj.file, {persistent: true, ignoreInitial: true});
    if(obj.callback.add != undefined)
        watcher.on('add', wrapCallback(obj.callback.add, obj.expression));
    if(obj.callback.change != undefined)
        watcher.on('change', wrapCallback(obj.callback.change, obj.expression));
    if(obj.callback.unlink != undefined)
        watcher.on('unlink', wrapCallback(obj.callback.unlink, obj.expression));
    if(obj.callback.addDir != undefined)
        watcher.on('addDir', wrapCallback(obj.callback.addDir, obj.expression));
    if(obj.callback.unlinkDir != undefined)
        watcher.on('unlinkDir', wrapCallback(obj.callback.unlinkDir, obj.expression));
    if(obj.callback.error != undefined)
        watcher.on('error', wrapCallback(obj.callback.error, obj.expression));
    watchers.push(watcher);
};
exports.watch = watch;

// **watchFiles**
//
// Function to start watching an array of files
//
// _Parameters:_
//
// * `file`: The list of files to watch
// * `expression`: A list of valid expressions
// * `callback`: A list of `callback` objects as decribed above
//
// _Throws:_
//
// * `Error`: If the length of all the three supplied lists are not same

var watchFiles = function(file, expression, callback) {
    if(file.length != expression.length && expression.length != callback.length)
        throw new Error("All arguments must be of the same length");
    for(var i = 0; i < file.length; i++)
        watch(file[i], expression[i], callback[i]);
};
exports.watchList = watchList;

// **deleteWatch**
//
// Function to stop watching a file
//
// _Parameters:_
//
// * `file`: The file to stop watching
//
// _Throws:_
//
// * `Error`: If the file is not being watched already

var deleteWatch = function(file) {
    for(var i = 0; i < watchList.length; i++) {
        if(watchList[i].file === file) {
            watchers[i].close();
            watchList.splice(i, 1);
            watchers.splice(i, 1);
            return;
        }
    }
    throw new Error(file + " was not being watched previously");
};
exports.deleteWatch = deleteWatch;

// **changeWatch**
//
// Function to change the parameters of a watcher
//
// _Parameters:_
//
// * `file`: The file whose watcher's parameters will be modified
// * `expression`: The new expression against which the watcher will be matched
// * `callback`: A valid callback object as described above.
//
// _Throws:_
//
// * `Error`: If the file is not being watched already

var changeWatch = function(file, expression, callback) {
    deleteWatch(file);
    watch(file, expression, callback);
};
exports.changeWatch = changeWatch;

// **changeTrigger**
//
// Function change the triggered callback on a watch event
//
// _Parameters:_
//
// * `file`: The file whose trigger is to be changed
// * `event`: The event on which the trigger is to be executed. It can be one of:
//   * `add`: Called when a file is added
//   * `change`: Called when a watched file is changed
//   * `unlink`: Called when a watched file is removed from disk
//   * `error`: Called when an error is encountered
// * `callback`: The function to be executed when the above event happens
//
// _Throws:_
//
// * `Error`: If the file is not being watched already

var changeTrigger = function(file, event, callback) {
    for(var i = 0; i < watchList.length; i++) {
        if(watchList[i].file === file) {
            watchers[i].on(event, wrapCallback(callback, watchList[i].expression));
            watchList[i].callback[event] = callback;
            return;
        }
    }
    throw new Error(file + " was not being watched previously");
};
exports.changeTrigger = changeTrigger;

// **getTriggerList**
//
// Get the list of acting triggers on a file watcher
//
// _Parameters:_
//
// * `file`: The file whose triggers are to be returned
//
// _Returns:_
//
// The callback object for that file, with the named functions as `add`, `change`, `unlink`, `error` that had been set on that watcher
//
// _Throws:_
//
// * `Error`: If the file is not being watched already

var getTriggerList = function(file) {
    for(var i = 0; i < watchList.length; i++) {
        if(watchList[i].file === file)
            return watchList[i].callback;
    }
    throw new Error(file + " was not being watched previously");
};
exports.getTriggerList = getTriggerList;

// **deleteTrigger**
//
// Remove the trigger for an event from a watcher
//
// _Parameters:_
//
// * `file`: The file whose trigger is to be removed
// * `event`: The event whose trigger is to be removed
//
// _Throws:_
//
// * `Error`: If the file is not being watched already

var deleteTrigger = function(file, event) {
    var fn = function(file) {};
    for(var i = 0; i < watchList.length; i++) {
        if(watchList[i].file === file) {
            watchers[i].on(event, fn);
            watchList[i].callback[event] = fn;
            return;
        }
    }
    throw new Error(file + " was not being watched previously");
};
exports.deleteTrigger = deleteTrigger;

var findByExpression = function(expression) {
    var result = [];
    for(var i = 0; i < watchList.length; i++) {
        if(watchList[i].expression === expression)
            result.push(watchList[i].expression);
    }
    return result;
};
exports.findByExpression = findByExpression;

var changeExpression = function(file, expression) {
    for(var i = 0; i < watchList.length; i++) {
        if(watchList[i].file === file) {
            watchList[i].expression = expression;
            if(watchList[i].callback.add != undefined)
                watcher.on('add', wrapCallback(watchList[i].callback.add, expression));
            if(obj.callback.change != undefined)
                watcher.on('change', wrapCallback(watchList[i].callback.add, expression));
            if(obj.callback.unlink != undefined)
                watcher.on('unlink', wrapCallback(watchList[i].callback.add, expression));
            if(obj.callback.error != undefined)
                watcher.on('error', wrapCallback(watchList[i].callback.add, expression));
            return;
        }
    }
    throw new Error(file + " was not being watched previously");
};
exports.changeExpression = changeExpression;

function wrapCallback(realCallback, expression) {
    var fn = function(file) {
        if(parseExpression(file, expression))
            realCallback(file);
    }
    return fn;
}

function parseExpression(file, expression) {
    if(expression instanceof Array) {
        switch(expression[0]) {
            case "allof":
                return parseAllOf(file, expression);
            case "anyof":
                return parseAnyOf(file, expression);
            case "not":
                return parseNot(file, expression);
            case "true":
                return true;
            case "false":
                return false;
            case "suffix":
                return parseSuffix(file, expression);
            case "regex":
                return parseRegex(file, expression);
            case "iregex":
                return parseIRegex(file, expression);
            case "name":
                return parseName(file, expression);
            case "iname":
                return parseIName(file, expression);
            case "empty":
                return parseEmpty(file);
            case "exists":
                return parseExists(file);
            case "since":
                return parseSince(file, expression);
            case "type":
                return parseType(file, expression);
        }
    } else
        return expression;
}

function parseAllOf(file, expression) {
    var result = true;
    for(var i = 1; i < expression.length; i++) {
        result = result && parseExpression(file, expression[i]);
        if(!result)
            return false;
    }
    return true;
}

function parseAnyOf(file, expression) {
    for(var i = 1; i < expression.length; i++)
        if(parseExpression(file, expression[i]))
            return true;
    return false;
}

function parseNot(file, expression) {
    return !parseExpression(file, expression[1]);
}

function parseSuffix(file, expression) {
    if(path.extname(file).toLowerCase() === expression[1].toLowerCase())
        return true;
    return false;
}

function parseRegex(file, expression) {
    var re = new RegExp(expression[1]);
    return re.test(file);
}

function parseIRegex(file, expression) {
    var re = new RegExp(expression[1], "i");
    return re.test(file);
}

function parseName(file, expression) {
    if(path.basename(file) === expression[1])
        return true;
    return false;
}

function parseIName(file, expression) {
    if(path.basename(file).toLowerCase() === expression[1].toLowerCase())
        return true;
    return false;
}

function parseEmpty(file) {
    var stat = fs.statSync(file);
    if(stat.size === 0)
        return true;
    else
        return false;
}

function parseExists(file) {
    return fs.existsSync(file);
}

function parseSince(file, expression) {
    var stat = fs.statSync(file);
    switch(expression[2]) {
        case "mtime":
            return stat.mtime > expression[1];
        case "ctime":
            return stat.ctime > expression[1];
        case "atime":
            return stat.atime > expression[1];
    }
}

function parseType(file, expression) {
    var stat = fs.lstatSync(file);
    switch(expression[1]) {
        case "b":
            return stat.isBlockDevice();
        case "c":
            return stat.isCharacterDevice();
        case "d":
            return stat.isDirectory();
        case "f":
            return stat.isFile();
        case "p":
            return stat.isFIFO();
        case "l":
            return stat.isSymbolicLink();
        case "s":
            return stat.isSocket();
    }
}
