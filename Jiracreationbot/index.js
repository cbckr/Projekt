'use strict';


// --------------- Zwingend benötigt für das Jira-Ticket -----------------------

// Initialiserung einer JiraApi um später damit ein Ticket erstellen zu lönnen
const JiraApi = require('jira').JiraApi;
const jira = new JiraApi('https', process.env.JIRA_HOST, 443, process.env.JIRA_USER, process.env.JIRA_PW, '2');




// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

// Eine Hilfsfunktion die am Ende dafür sorgt das der Rückgabewert dieser Lambdafunktion in einem
// Format ist welches Lex darstellen kann, das elicitSlot bedeutet, dass es zu einer
// fehlerhaften Eingabe kam und Lex nun den Benutzer auffordert die richtige Eingabe zu tätigen.

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

// Eine Hilfsfunktion die am Ende dafür sorgt das der Rückgabewert dieser Lambdafunktion in einem
// Format ist welches Lex darstellen kann, das close bedeutet, dass Amazon nach dieser Rückgabe
// keine weitere Eingaben mehr erwartet und somit der Intent bearbeitet wurde.

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

// Eine Hilfsfunktion die am Ende dafür sorgt das der Rückgabewert dieser Lambdafunktion in einem
// Format ist welches Lex darstellen kann, das delegate bedeuet, dass der Kontrollfluss des Gesprächs
// wieder an Lex zurückgegeben wird.

function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}




// ---------------- Validation Function --------------------------------------------------


// Prüft ob der Slot Customernumber wirklich eine Zahl entält und gibt dementsprechend true oder false zurück

function isValidNumber(number)
{
    try {
        return !(isNaN(number));
    } catch (err) {
        return false;
    }
}

// DieseFunktion sorgt dafür das Ergebnis der Validierung in ei Format zu bringen welches dann von
// der Funktion elicitSlot gelesen werden kann

function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent == null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}

// Diese Funktion übernimmt die Validierung der Slots und prüft nach ob die Eingaben alle richtig sind

function validateJiraBot(service, number){

    // Das Array enthält die Services um abgleichen zu können
    const serviceTypes = ['seamless integration', 'automated operations', 'value-oriented planning', 'step-by-step development'];

    // vergelicht den übergebenen Wert mit dem Array und handelt entsprechend
    if (service && serviceTypes.indexOf(service.toLowerCase()) === -1){
        return buildValidationResult(false, 'Stormservices', 'We do not provide the service: ' + service + ' please select a service we do provide!');
    }

    // nutzt das Ergebnis der Funktion isValidNumber und handelt entsprechend
    if(!isValidNumber(number)) {
            return buildValidationResult(false, 'Customernumber', 'This is not a Number, and therefore not a Customer Number, please try an actual Number!');
        }

    // Sollten alle Eingaben in Ordnung gewesen sein, wird diese positiva Bestätigung weitergegeben
    return buildValidationResult(true, null, null);
}




// --------------- Functions that creates the Jira-Ticket -----------------------


// Diese Funktion sorgt dafür, dass das Jiraticket erstellt werden kann, es benutzt dafür die ganz oben definierte
// JiraApi im weiteren Verlauf

function createTicket(service, number, callback)
{

    // Erstellen einer JSON-Datei im richtigen Format um von Jira als Ticket dargestellt werden, ihr werden die
    // Customernumber und der Servicetyp mitgegeben, damit man mit dem Ticket auch etwas anfangen kann.
    const data = {
        "fields": {
            "project": {
                "key": process.env.JIRA_PROJECT
            },
            "summary": number + " Automated Ticket Creation from Bot, this is a Testticket created for the WiInf-Project",
            "description": "The user: " + number + "has a connectivity issue with the service " + service,
            "issuetype": {
                "name": process.env.JIRA_ISSUE_TYPE
            }
        }
    };


    // Hier wird nun das Ticket erstellt
    jira.addNewIssue(data, function(err, res){
        var succes;

        // Sollte die Erstellung des Tickets fehlgeschlagen sein wird ein entsprechendes consolelog erstellt
        // Außerdem wird die Variable succes auf false gesetzt.
        if (err) {
            console.log('There was an error during the creation of the ticket ' + service + ' Automated Ticket Creation from Bot the error is: ' + err);
            succes = false;
        }

        // Sollte die Erstellung des Tickets erfolgreich gewesein sein wird ein entsprechendes consolelog erstellt
        // Außerdem wird die Variable succes auf true gesetzt.
        if (res) {
            console.log('Created ticket ' + number + ' Automated Ticket Creation from Bot');
            succes = true;
        }
        // Der callback gibt die Variable succes zurück, wodurch dann die richtige Antwort bei
        // JiraIntendbehaviour getriggert werden kann
        callback(succes);
    });
}




// --------------- Functions that control the bot's behavior -----------------------

// Wird von der Funktion dispatch aufgerufen und bekommt den callback plus dem Request als JSON-Datei mitgeliefert

function JiraIntendbehaviour(intentRequest, callback) {

    // Die Variablen stellen die Notwendigen Daten da, welche aus der JSON-Datei gezogen werden
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const service = slots.Stormservices;
    const number = slots.Customernumber;
    const source = intentRequest.invocationSource;


    // Wird aufgerufen wenn der Request aus einem DialogCodeHook kam und sorgt für die richtige Weiterleitung und
    // Steuerung des Bots
    if(source === 'DialogCodeHook') {

        // Diese Funktion sorgt für die Überprüfung ob die Eingaben korrekt waren
        const validationResult = validateJiraBot(service, number);
        if (!validationResult.isValid) {
            // Sollte die Validierunfg fehlschlagen sorgt der elicitSlot dafür das der Benutzer informiert wird
            // Die richtige Eingabe zu tätigen
            slots[`${validationResult.violatedSlot}`] = null;
            callback(elicitSlot(sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }

        // Sollte die Validierung in Ordnung sein leitet dies die Gesprächskontrolle wieder an den Bot
        callback(delegate(sessionAttributes, intentRequest.currentIntent.slots));
        return;
    }

    // Wird aufgerufen wenn der Request aus einem FulfillmentCodeHook kam
    else
    {

        // Diese Funktion sorgt für das Erstellen eines Tickets
        createTicket(service, number, function(bool)
        {

            if(bool === true)
            {
                // Sollte alles geklappt haben bekommt der Benutzer eine positive Antwort vom Bot
                callback(close(sessionAttributes, 'Fulfilled',
                    {
                        'contentType': 'PlainText',
                        'content': "Your ticket has been created. We will try to solve the problem as soon as possible. Have a nice Day!"
                    }));
            }

            else
            {
                // Sollte etwas schiefgegangen sein bekommt der Benutzer eine negative Antwort vom Bot
                callback(close(sessionAttributes, 'Fulfilled',
                    {
                        'contentType': 'PlainText',
                        'content': "Unfortunately there was an error creating your ticket. Please contact us via E-Mail: support.storm@reply.de"
                    }));

            }

        });
    }

}




// --------------- Intents -----------------------


// Führt die Funktionen jeweils abhängig von dem Intent in der JSON-Datei aus
// Oder wirft einen Fehler aus wenn die Lambdafunktin für einen Intent spezifiziert wrd
// welcen sie nicht erfüllen kann.

function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // überprüft ob der mitgelieferte Intent bearbeitet werden kann
    if (intentName === 'Ticketcreater') {
        return JiraIntendbehaviour(intentRequest, callback);
    }
    // Der Fehler wird erstellt sollte der Intent des Lex-Request nicht von der Lambdafunktion bearbeitet werden können
    throw new Error(`Intent with name ${intentName} not supported`);
}




// --------------- Main handler -----------------------

// Ist der Einstiegspunkt für die Lambdafunktion und leitet die Daten und den callback weiter
// Die JSON-Datei welche durch Lex übergeben wird ist im event.

exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
            callback(null, response);
    });
    } catch (err) {
        callback(err);
    }
};