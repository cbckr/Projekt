//Importieren der AWS-SDK um mit dieser arbeiten zu können
var AWS = require('aws-sdk');

var sns = new AWS.SNS();

exports.handler = function (event,context,callback) {
    console.log(event);
    callback(null, "Finished");
};
