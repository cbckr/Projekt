var a = require('./dictionary_important');
var b = require('./dictionary_low');
var c = ['shutdown','test','offer','problem','meeting','blabla','systemfailure'];

var zaehler1 = 0;
var zaehler2 = 0;

function analyze(Functiondata, Dictionary, Countervariable) {
    for (var i = 0; i < Functiondata.length; ++i)
        if (Dictionary.includes(Functiondata[i])) {
            Countervariable += 1;
        }
        return Countervariable;
}

var resulta = analyze(c,a,zaehler1);
var resultb = analyze(c,b,zaehler2);

console.log(resulta);
console.log(resultb);

function evaluation(Functiondata_important,Functiondata_normal) {
    if(Functiondata_important < Functiondata_normal){
        console.log('Normal chosen');
    }
    else if(Functiondata_important == Functiondata_normal){
        console.log('Important chosen (equal)');
    }
    else console.log('Important chosen');
}

evaluation(resulta,resultb);
