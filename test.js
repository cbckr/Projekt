var fs = require('fs');
var daten = fs.readFileSync('001.json').toString();
var test = JSON.parse(daten);
var arr = [];

for(var i = 0;i < test.Body.data.length; ++i) {
    var res = test.Body.data[i];
    var res2 = String.fromCharCode(res);
    arr.push(res2);
}
var rueckgabe = arr.join("");
console.log(rueckgabe);



