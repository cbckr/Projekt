
//----------------------------------------------INITIALISIERUNG------------------------------------------------------

//Importieren der AWS-SDK um mit dieser arbeiten zu können
var AWS = require('aws-sdk');

//Erstellen einer Comprehend Instanz, welche die Analyse der Rohdaten übernimmt
//Erstellen einer SES Instanz, um die Ergebnisse per Mail zu verschicken
var ses = new AWS.SES();
var comprehend = new AWS.Comprehend();

//Importieren des Jira-Clienten, welcher API Anfragen ermöglicht
var JiraApi = require('jira').JiraApi;
var jira = new JiraApi('https', process.env.JIRA_HOST, 443, process.env.JIRA_USER, process.env.JIRA_PW, '2');

//Einlesen der Wörterbücher, welche zur Kategorisierung benutzt werden
var important = require('./dictionary_important');
var normal = require('./dictionary_normal');


//----------------------------------------------DATENVERARBEITUNG-----------------------------------------------------

//Handler, welcher als Einstiegspunkt für Lambda dient
exports.handler = function (event) {

    var keyPhraseRes = [];
    var counterImp = 0;
    var counterNorm = 0;

    //zieht aus dem Event, welches von der S3 Funktion ausgelöst wurde, die relevanten Daten
    var incData = event.Records[0].Sns.Message;

    //Parameter, die Sprache und Inputtext, für Comprehend spezifizieren
    var params = {
        LanguageCode: 'en',
        Text: incData
    };

//-------------------------------------------------DATENANALYSE-------------------------------------------------------

    //sucht im übergebenen Text nach Keyphrases und gibt diese zurück
    comprehend.detectKeyPhrases(params,function (err, data) {

        if(err) console.log(err);

        else
            var workdata = data.KeyPhrases;

            for(var i = 0; i < workdata.length; ++i){
                keyPhraseRes.push(workdata[i].Text.toLowerCase());
            }

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


        //Aufruf der Funktion um Auswertungsergebnisse zu erhalten
        var resultImp = analyze(keyPhraseRes,important,counterImp);
        var resultNorm = analyze(keyPhraseRes,normal,counterNorm);


        //-----------------------------------ERGEBNISAUSWERTUNG UND VERARBEITUNG--------------------------------------

        //Entscheidet anhand der Zählvariablen, welche Wichtigkeit die Email besitzt
        function evaluation(Functiondata_important,Functiondata_normal) {

            if (Functiondata_important >= Functiondata_normal) {

                //Senden einer Email, welche in der Parametern als Wichtig gekennzeichnet wird
                ses.sendEmail(
                        {Destination: {
                                ToAddresses: ['stromemail001@gmail.com']},
                            Message: {
                                Body: {
                                    Text: {
                                        Charset: 'UTF-8',
                                        Data: incData
                                    }
                                },
                                Subject: {
                                    Charset: 'UTF-8',
                                    Data: '[Important]'
                                }
                            },
                            Source: 'stromemail001@gmail.com'
                        },
                        function (err) {console.log(err) });


                //Definition der Parameter für die Ticketerstellung in Jira
                var jiraImpData = {
                    "fields": {
                        "project": {
                            "key": process.env.JIRA_PROJECT
                        },
                        "summary": '[Important]',
                        "description": incData,
                        "issuetype": {
                            "name": process.env.JIRA_ISSUE_TYPE
                        }
                    }
                };

                //Erstellung der Tickets, welche die Emails beinhalten
                jira.addNewIssue(jiraImpData, function (err, data) {

                    if (err) {
                        console.log('There was an error during the creation of the ticket "' + 'Important' + '"\n' + err);
                    }
                    else {
                        console.log('Created ticket "' + 'Important' + '"\n' + data);
                    }
                });
                }

            else {

                //Senden einer Email, welche in der Parametern als Normal gekennzeichnet wird
                ses.sendEmail({
                        Destination: {
                            ToAddresses: ['stromemail001@gmail.com']},
                            Message: {
                                Body: {
                                    Text: {
                                        Charset: 'UTF-8',
                                        Data: incData
                                    }
                                },
                                Subject: {
                                    Charset: 'UTF-8',
                                    Data: '[Normal]'
                                }
                            },
                            Source: 'stromemail001@gmail.com'
                        },
                        function (err) {console.log(err)});

                //Definition der Parameter für die Ticketerstellung in Jira
                var jiraNormData = {
                    "fields": {
                        "project": {
                            "key": process.env.JIRA_PROJECT
                        },
                        "summary": '[Normal]',
                        "description": incData,
                        "issuetype": {
                            "name": process.env.JIRA_ISSUE_TYPE
                        }
                    }
                };

                //Erstellung der Tickets, welche die Emails beinhalten
                jira.addNewIssue(jiraNormData, function (err, data) {

                    if (err) {
                        console.log('There was an error during the creation of the ticket "' + 'Normal' + '"\n' + err);
                    }
                    else {
                        console.log('Created ticket "' + 'Normal' + '"\n' + data);
                    }
                });
            }
        }

            //Aufruf der zuvor definierten Funktion, um die Emails auszuwerten
            evaluation(resultImp, resultNorm);

    });
};