// var fs = require('fs');
var simpleparser = require('mailparser').simpleParser;
// var daten = fs.readFileSync('./mimemail.txt').toString();

// simpleparser(daten,function(err,data){
//     if(err) console.log(err);
//     else var tst = [];
//             tst.push(data.from.text,data.to.text,data.subject,data.text);
//             for(var i = 0; i < tst.length; ++i){
//                 console.log(tst[i]);
//             }
// });

// import entire SDK
var AWS = require('aws-sdk');
//Erstellen einer S3 Instanz und locken der API-Version
var s3 = new AWS.S3({region: 'us-east-1', apiVersion: '2006-03-01'});
//Erstellen einer SNS Instanz, um
var sns = new AWS.SNS();

//Herausfiltern des Bucketnamen und Objektkeys aus den Eventdaten
exports.handler = function(event,context,callback){
    var bucket = event.Records[0].s3.bucket.name;
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    var params = {
        Bucket : bucket,
        Key: key
    };

    //Lieferung der Daten des Objektes und senden dieser Daten an eine SNS Topic
    s3.getObject(params, function (err, data) {
        if (!err) {
            var incdata = data.Body;
            var convdata = incdata.toString();

            simpleparser(convdata,function(err,data){
                if(err) console.log(err);
                else var tst = [];
                tst.push(data.from.text,data.to.text,data.subject,data.text);
                for(var i = 0; i < tst.length; ++i){
                    console.log(tst[i]);
                }
            });


        }
        else {
            console.log(err);
        }
    })
};

