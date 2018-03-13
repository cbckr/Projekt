//Importieren der AWS-SDK um mit dieser arbeiten zu können
var AWS = require('aws-sdk');
//Erstellen einer Comprehend Instanz, welche die Analyse der Rohdaten übernimmt
//Erstellen einer SES Instanz, um die Ergebnisse per Maill zu verschicken
var ses = new AWS.SES();
var comprehend = new AWS.Comprehend();
//Erstellen eines Mailparsers, welcher die eingehende Emails verarbeitet
var simpleparser = require('mailparser').simpleParser;
//Importieren des Jira-Clienten, welcher API Anfragen ermöglicht
var JiraApi = require('jira-client');
var jira = new JiraApi('https', process.env.JIRA_HOST, 443, process.env.JIRA_USER, process.env.JIRA_PW, '2');
//Einlesen der Wörterbücher, welche zur Kategorisierung benutzt werden
var important = require('./dictionary_important');
var normal = require('./dictionary_normal');
var a = [];
var countera = 0;
var counterb = 0;

//Handler, welcher als Einstiegspunkt für Lambda dient
exports.handler = function (event) {

    // Analysiert ob die Daten, welche die Comprehendfunktion zurückgibt
    //im übergebenen Array enthalten sind und zählt gegebenenfalls die
    //entsprechend Zählervariable hoch
    function analyze(Functiondata, Dictionary, Countervariable) {
        Functiondata.forEach(function (item){
            Dictionary.forEach(function (entries) {
                if(item.indexOf(entries) >= 0){
                    Countervariable += 1;
                }
            })
        });
        return Countervariable;
    }

    //zieht aus dem Event, welches von der S3 Funktion ausgelöst wurde, die relevanten Daten
    var incdata = event.Records[0].Sns.Message;

    //Parsed die Email im Mime Format in eine JSON Datenstruktur, auf der man navigieren kann und sich
    //rauszieht was man benötigt
    simpleparser(incdata,function(err,data) {
        if (err) console.log(err);
        else var parseres = [];
        parseres.push(data.from.text, data.to.text, data.subject, data.text);

    //Parameter, die Sprache und Inputtext, für Comprehend spezifizieren
    var params = {
        LanguageCode: 'en',
        Text: parseres[3].toString()
    };

    //sucht im übergebenen Text nach Keyphrases und gibt diese zurück
    comprehend.detectKeyPhrases(params,function (err, data) {
        if(err) console.log(err);
        else
            var workdata = data.KeyPhrases;
        for(var i = 0; i < workdata.length; ++i){
            a.push(workdata[i].Text.toLowerCase());
        }

        var resultimp = analyze(a,important,countera);
        var resultnorm = analyze(a,normal,counterb);

        var from = parseres[0].toString();
        var to = parseres[1].toString();
        var subject = parseres[2].toString();
        var text = parseres[3].toString();


        //Entscheidet anhand der Zählvariablen, welche Wichtigkeit die Email besitzt
        function evaluation(Functiondata_important,Functiondata_normal) {

            if(Functiondata_important >= Functiondata_normal){
                ses.sendEmail({Destination: {
                        ToAddresses: ['stromemail001@gmail.com']},
                    Message: {
                        Body:{
                            Text: {
                                Charset: 'UTF-8',
                                Data: "FROM: "+from+"      TO: "+to+"\n"+text
                            }
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: '[Important]' + subject
                        }
                    },
                    Source: 'stromemail001@gmail.com'

                },function (err) { console.log(err) });

                var jiradata = {
                    "fields": {
                        "project": {
                            "key": process.env.JIRA_PROJECT
                        },
                        "summary": '[Important]' + subject,
                        "description": "FROM: "+from+"      TO: "+to+"\n"+text,
                        "issuetype": {
                            "name": process.env.JIRA_ISSUE_TYPE
                        }
                    }
                };

                jira.addNewIssue(jiradata,function(err,data){
                    if (err) {
                        printWarning('There was an error during the creation of the ticket "'+subject+'"\n'+err);
                    }
                    else{
                        printOutput('Created ticket "'+subject+'"\n'+data);
                    }
                    callback(err, data);
                });
            }
            else
                ses.sendEmail({Destination: {
                        ToAddresses: ['stromemail001@gmail.com']},
                    Message: {
                        Body:{
                            Text: {
                                Charset: 'UTF-8',
                                Data: "FROM: "+from+"      TO: "+to+"\n"+text
                            }
                        },
                        Subject: {
                            Charset: 'UTF-8',
                            Data: '[Normal]' + subject
                        }
                    },
                    Source: 'stromemail001@gmail.com'

                },function (err) { console.log(err) });
        }
            evaluation(resultimp,resultnorm);
        })
    });
};

