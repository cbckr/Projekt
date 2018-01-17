// import entire SDK
var AWS = require('aws-sdk');
//Erstellen einer S3 Instanz und locken der API-Version
var s3 = new AWS.S3({region: 'us-east-1', apiVersion: '2006-03-01'});


exports.handler = function(event,context,callback){
    var bucket = event.Records[0].s3.bucket.name;
    var key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    var params = {
        Bucket : bucket,
        Key: key,
    };
    s3.getObject(params, function (err, data) {
        if (!err) {
            //console.log("Es kamen Daten an und wir sind in die richtige Anweisung gesprungen");
            //var daten = data.toString();
            //console.log("toString war erfolgreich" + daten);
            //var test = JSON.parse(daten);
            var arr = [];
            console.log("Die Variablen wurden intialisiert");

            for(var i = 0;i < test.Body.data.length; ++i) {
                var res = test.Body.data[i];
                var res2 = String.fromCharCode(res);
                arr.push(res2);
                console.log("Die Schleife ist: " + i +"mal durchgelaufen");
            }
            console.log("Die Schleife wurde verlassen");
            var rueckgabe = arr.join("");
            console.log("Die rueckgabe Variable wurde befüllt")
            //console.log('BODY:', data.Body);
            console.log(rueckgabe);
            callback(null, rueckgabe);
        }
        else {
            console.log(err);
            const message = `Error getting object ${key} from bucket ${bucket}. Make sure they exist and your bucket is in the same region as this function.`;
            console.log(message);
            callback(message);
        }
    })
};





/*
var test = s3.createBucket(params, function (err, data) {
    if(err) console.log(err, err.stack);
    else console.log(data);

});
console.log("test");

s3.handler = function(event, context, callback) {
      console.log("Wert : " + event.key);
      callback(null, "Es hat geklappt");
};

//Comamand zum erstellen eines AWS Buckets mit dem vorgegebenen Parameter
var params = {
    Bucket: "tstbuc123"
};

s3.createBucket(params, function (err, data) {
        if(err) console.log(err, err.stack);
        else console.log(data);
    })

daten = {
    "Records": [
        {
            "eventVersion": "2.0",
            "eventTime": "1970-01-01T00:00:00.000Z",
            "requestParameters": {
                "sourceIPAddress": "127.0.0.1"
            },
            "s3": {
                "configurationId": "testConfigRule",
                "object": {
                    "eTag": "0123456789abcdef0123456789abcdef",
                    "sequencer": "0A1B2C3D4E5F678901",
                    "key": "HappyFace.jpg",
                    "size": 1024
                },
                "bucket": {
                    "arn": "arn:aws:s3:::mybucket",
                    "name": "sourcebucket",
                    "ownerIdentity": {
                        "principalId": "EXAMPLE"
                    }
                },
                "s3SchemaVersion": "1.0"
            },
            "responseElements": {
                "x-amz-id-2": "EXAMPLE123/5678abcdefghijklambdaisawesome/mnopqrstuvwxyzABCDEFGH",
                "x-amz-request-id": "EXAMPLE123456789"
            },
            "awsRegion": "us-east-1",
            "eventName": "ObjectCreated:Put",
            "userIdentity": {
                "principalId": "EXAMPLE"
            },
            "eventSource": "aws:s3"
        }
    ]
}
*/



