var assert = require("assert");
var fs = require("fs");
var path = require("path");
var watchman = require("../watchman");

describe('watchman', function() {
    before(function() {
        fs.writeFileSync('test.txt', 'abc');
    });

    // Test for the change trigger
    describe('watch()', function() {
        it('should trigger callback by validating expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["true"], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abcd');
        });
    });

    // Test for the add trigger
    describe('watch()', function() {
        it('should trigger callback by validating expression when the unlink event occurs', function(){
            function addTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["true"], {add: addTrigger});
            fs.writeFileSync('test.txt', 'abc');
        });
    });

    // Test for the allof expression
    describe('watch()', function() {
        it('should trigger callback by validating allof expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["allof", ["type", "f"], ["true"]], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abcd');
        });
    });

    // Test for the anyof expression
    describe('watch()', function() {
        it('should trigger callback by validating anyof expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["anyof", ["type", "f"], ["false"]], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abc');
        });
    });

    // Test for the not expression
    describe('watch()', function() {
        it('should trigger callback by validating not expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["not", ["empty"]], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abcd');
        });
    });

    // Test for the suffix expression
    describe('watch()', function() {
        it('should trigger callback by validating allof expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["suffix", ".txt"], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abc');
        });
    });

    // Test for the name expression
    describe('watch()', function() {
        it('should trigger callback by validating name expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["name", "test.txt"], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abcd');
        });
    });

    // Test for the iname expression
    describe('watch()', function() {
        it('should trigger callback by validating iname expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["iname", "TEST.TXT"], {change: changeTrigger});
            fs.writeFileSync('test.txt', 'abc');
        });
    });

    // Test for the empty expression
    describe('watch()', function() {
        it('should trigger callback by validating empty expression when the change event occurs', function(){
            function changeTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["empty"], {change: changeTrigger});
            fs.writeFileSync('test.txt', '');
        });
    });

    // Test for the unlink trigger
    describe('watch()', function() {
        it('should trigger callback by validating expression when the unlink event occurs', function(){
            function unlinkTrigger(file) {
                assert.equal('test.txt', path.basename(file));
            }
            watchman.watch('test.txt', ["true"], {unlink: unlinkTrigger});
            fs.unlinkSync('test.txt');
        });
    });
});
