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
        Key: key,
    };

    //Lieferung der Daten des Objektes und senden dieser Daten an eine SNS Topic
    s3.getObject(params, function (err, data) {
        if (!err) {
            var incdata = data.Body;
            var convdata = incdata.toString();

            var params = {
                Message: convdata,
                TopicArn: 'arn:aws:sns:us-east-1:647707457335:Emailverarbeitung'
            };

            sns.publish(params, function (err2, data2){
                if(err2) console.log(err2);
                else console.log("Topic Publication finished with" + data2);
                });
        }
        else {
            console.log(err);
            const message = "Error getting object" + ${key} + "from bucket" + ${bucket} + ". Make sure they exist and your bucket is in the same region as this function.";
            console.log(message);
            callback(message);
        }
    })
};

