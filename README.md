# Watchman.js

A file watching API with a powerful expression parser

Watchman.js exists to watch files and raise events when files change (or get deleted/added). It can trigger actions (such as recompiling files) by matching the expressions when the files change.

##Concepts

Watchman.js can watch one or more files or directory trees. It matches the files that have changed against its corresponding expression. If the expression validates to be true the callback for that event is called.

The expression has to be a valid JavaScript Array. It will have tokens which can be expressions themselves, thus allowing you to next expressions. For example, a valid expression would be:

`['true']` or `['anyof', ['empty'], ['not', ['exists']]]`
