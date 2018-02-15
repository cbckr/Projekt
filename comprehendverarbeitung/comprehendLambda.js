//Importieren der AWS-SDK um mit dieser arbeiten zu können
var AWS = require('aws-sdk');

//Erstellen einer SNS Instanz um die Daten per Mail verschicken zu können
//Erstellen einer Comprehend Instanz, welche die Analyse der Rohdaten übernimmt
//var sns = new AWS.SNS();

var comprehend = new AWS.Comprehend();
var a = [];

//Handler, welcher als Einstiegspunkt für Lambda dient
exports.handler = function (event,context,callback) {

    //zieht aus dem Event, welches von der S3 Funktion ausgelöst wurde, die relevanten Daten
    var incdata = event.Records[0].Sns.Message;

    //Parameter, die Sprache und Inputtext, für Comprehend spezifizieren
    var params = {
        LanguageCode: 'en',
        Text: incdata
    };

    //sucht im übergebenen Text nach Keyphrases und gibt diese zurück
    comprehend.detectKeyPhrases(params,function (err, data) {
        if(err) console.log(err);
        else
            var workdata = data.KeyPhrases;
        for(var i = 0; i < workdata.length; ++i){
            a.push(workdata[i].Text);
        }

    });

};


/*
//gibt die Daten per Email an die angelegte Mailadresse von Storm aus
    var params = {
        Message: incdata,
        TopicArn: 'arn:aws:sns:us-east-1:647707457335:ComprehendTest',
        Subject: 'Daten angekommen'
    };

    sns.publish(params,function (err, data3) {
        if(err) console.log(err);
        else console.log("Publication finished");
    })*/