//Importieren der AWS-SDK um mit dieser arbeiten zu können
var AWS = require('aws-sdk');

//Erstellen einer SNS Instanz um die Daten per Mail verschicken zu können
//Erstellen einer Comprehend Instanz, welche die Analyse der Rohdaten übernimmt

var ses = new AWS.SES();
var comprehend = new AWS.Comprehend();
var a = [];
var countera = 0;
var counterb = 0;
var important = require('./dictionary_important');
var normal = require('./dictionary_normal');

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
            a.push(workdata[i].Text.toLowerCase());
        }
    });

    //Analysiert ob die Daten, welche die Comprehendfunktion zurückgibt
    //im übergebenen Array enthalten sind und zählt gegebenenfalls die
    //entsprechend Zählervariable hoch
    function analyze(Functiondata, Dictionary, Countervariable) {
        for (var i = 0; i < Functiondata.length; ++i)
            if (Dictionary.includes(Functiondata[i])) {
                Countervariable += 1;
            }
        return Countervariable;
    }

    var resultimp = analyze(a,important,countera);
    var resultnorm = analyze(a,normal,counterb);

    //Entscheidet anhand der Zählvariablen, welche Wichtigkeit die Email besitzt
        function evaluation(Functiondata_important,Functiondata_normal) {
        if(Functiondata_important < Functiondata_normal){
            ses.sendEmail({Destination: {
                    ToAddresses: ['stromemail001@gmail.com']},
                Message: {
                    Body:{
                        Text: {
                            Charset: 'UTF-8',
                            Data: incdata
                        }
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: '[Important]'
                    }
                },
                Source: 'stromemail001@gmail.com'

            },function (err) { console.log(err) });
        }
        else if(Functiondata_important == Functiondata_normal){
            ses.sendEmail({Destination: {
                    ToAddresses: ['stromemail001@gmail.com']},
                Message: {
                    Body:{
                        Text: {
                            Charset: 'UTF-8',
                            Data: incdata
                        }
                    },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: '[Important]'
                    }
                },
                Source: 'stromemail001@gmail.com'

            },function (err) { console.log(err) });
        }
        else
            ses.sendEmail({Destination: {
                    ToAddresses: ['stromemail001@gmail.com']},
                Message: {
                    Body:{
                        Text: {
                            Charset: 'UTF-8',
                            Data: incdata
                        }
                        },
                    Subject: {
                        Charset: 'UTF-8',
                        Data: '[Normal]'
                    }
                },
                Source: 'stromemail001@gmail.com'

            },function (err) { console.log(err) });
    }

    evaluation(resultimp,resultnorm);
};