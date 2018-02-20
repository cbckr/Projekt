var fs = require('fs');
var simpleparser = require('mailparser').simpleParser;
var daten = fs.readFileSync('./mimemail.txt').toString();


var tst = simpleparser(daten);

var test = tst.then(function (value) { console.log(value); return value; });
// console.log(test.attachments.text);


