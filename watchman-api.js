var fs = require("fs");
var path = require("path");
var chokidar = require("chokidar");

var watchList = [];
var watchers = [];

var watch = function(file, expression, callback) {
    var obj = { file: file,
                expression: expression,
                callback: callback };
    watchList.push(obj);
    var watcher = chokidar.watch(obj.file, {persistent: true});
    if(obj.callback.add != undefined)
        watcher.on('add', wrapCallback(obj.callback.add, obj.expression));
    if(obj.callback.change != undefined)
        watcher.on('change', wrapCallback(obj.callback.change, obj.expression));
    if(obj.callback.unlink != undefined)
        watcher.on('unlink', wrapCallback(obj.callback.unlink, obj.expression));
    if(obj.callback.error != undefined)
        watcher.on('error', wrapCallback(obj.callback.error, obj.expression));
    watchers.push(watcher);
};

var watchList = function(file, expression, callback) {
    if(file.length != expression.length && expression.length != callback.length)
        throw new Error("All arguments must be of the same length");
    for(var i = 0; i < file.length; i++)
        watch(file[i], expression[i], callback[i]);
};

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
}

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
    var result = false;
    for(var i = 1; i < expression.length; i++)
        result = result || parseExpression(file, expression[i]);
    return result;
}

function parseNot(file, expression) {
    return !parseExpression(file, expression[1]);
}

function parseSuffix(file, expression) {
    if(file.slice( -expression[1].length) === expression[1])
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

//////////////////////////////////////////////////////////////////////////
function demoCallback(file) {
    console.log(file);
}
console.log("trying to test");
watch("/media/Workspace/varchas-site.txt", ["allof", ["type", "f"], ["empty"]], {change: demoCallback});
