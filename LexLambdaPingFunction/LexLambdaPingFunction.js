'use strict';


// --------------- Helpers -----------------------

// Eine Hilfsfunktion die am Ende dafür sorgt das der Rückgabewert dieser Lambdafunktion in einem
// Format ist welches Lex darstellen kann, das close bedeutet, dass Lex nach dieser Rückgabe
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




// --------------- PingLogik -----------------------

const pinger = require('request'); // Lädt die Bibliothek request welche für den http-request zwingeng notwendig ist

// Diese Funktion führt die funktion pinger aus, sie dient lediglich um eventuelle Programmfehler
// mit einem try/catch abzufangen

function requester (http, callback)
{

    // Versucht pinger auszuführen
    try
    {
        // pinger setzt die http-Request um
        pinger(http, function (error, res, body)
        {
            var online; // Diese Variable wird entweder auf true oder false gesetzt.

            // Dies tritt ein wenn die Website erreichbar ist
            if (!error && res.statusCode === 200)
            {
                online = true;

            }

            // Wenn die Website erreichbar ist aber dennoch ein Problem auftritt
            else if (!error)
            {
                online = false;

            }

            // Wenn es einen Fehler gibt beim Laden
            else
            {
                online = false;

            }
            // Der callback gibt die Variable zurück damit in onlinerequest die if-Abfragen bearbeitet werden können
            callback(online);

        });
    }
    // Sollte es zu irgendeinem Fehler kommen welcher die Ausführung von pinger verhindert
    catch(error)
    {
        console.log(error);
    }

}




//------------MainLogik--------------------------


// Diese Funktion wird durch Dispatch weitergeleitet, dabei wird ab hier JSON-Datei von Lex als intentRequest
// bezeichnet. Die if-Abfrage schaut nach ob der mitgegebene Slot-Wert einem der bekannten Werte entspricht.
// Die  process.env Variablen entsprechen dabei den in Lambda definierten Variablen und enthalten
// die jeweiligen http-Adressen.

function fulfiller(intentRequest, callback)
{

    // Diese Variable wird mit dem Wert belegt welche der Slot des Requests annimmt, siehe die Dokumentation für eine
    // genauere Erklärung
    const servicetype = intentRequest.currentIntent.slots.ServiceTypes;

    if(servicetype === 'Seamless Integration')
    {
        var seamless = process.env.Seamless_Integration;
        onlinerequest(intentRequest, callback, seamless);
    }
    else if(servicetype === "Automated Operations")
    {
        var automated = process.env.Automated_Operations;
        onlinerequest(intentRequest, callback, automated);
    }

    else if(servicetype === "Value-oriented Planning")
    {
        var value_oriented = process.env.Value_oriented_Planning;
        onlinerequest(intentRequest, callback, value_oriented);
    }

    else if(servicetype === "Step-by-Step Development")
    {
        var step_by_step = process.env.Step_by_Step_Development;
        onlinerequest(intentRequest, callback, step_by_step);
    }

    // Wird bei Tippfehlern aufgerufen
    else
    {
        const sessionAttributes = intentRequest.sessionAttributes;
        const slots = intentRequest.currentIntent.slots;
        const service = slots.ServiceTypes;
        callback(close(sessionAttributes, 'Fulfilled', {'contentType': 'PlainText', 'content': "We do not provide this " + service + ", please ask for the status of an existent service."}));
    }

}




// --------------- Events -----------------------


// Wird von der Funktion Fulfiller aufgerufen und bekommt die jeweilige http-Adresse mitgeliefert


function onlinerequest(intentRequest, callback, http) {

    // Die Variablen stellen die Notwendigen Daten da, welche aus der JSON-Datei gezogen werden
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;
    const service = slots.ServiceTypes;
    const servicedialog = " If you want to create a ticket please type: 'I want to create a ticket' and follow the instructions.";



    // Diese Funktion führt den Ping durch und liefert einen boolean-Wert zurück
    // Über diesen Wert wird Entschieden welche Nachricht der Bot zurückliefert
    requester(http, function(bool) {

        if (bool === true)
        {
            // Wenn der Ping Erfolgreich war gibt der Bot diese Message aus
            callback(close(sessionAttributes, 'Fulfilled',
                {'contentType': 'PlainText', 'content': "The Service " + service + " is online"}));

        }

        else
        {

            // Wenn der Ping Fehlschlug gibt der Bot diese Message aus
            callback(close(sessionAttributes, 'Fulfilled',
                {'contentType': 'PlainText', 'content': "The Service " + service + " is currently unavailable." + servicedialog}));

        }

    });


}




// --------------- Intents -----------------------


// Führt die Funktionen jeweils abhängig von dem Intent in der JSON-Datei aus
// Oder wirft einen Fehler aus wenn die Lambdafunktin für einen Intent spezifiziert wrd
// welcen sie nicht erfüllen kann.

function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // überprüft ob der mitgelieferte Intent bearbeitet werden kann
    if (intentName === 'ServiceRequest') {
        return fulfiller(intentRequest, callback);
    }
    // Der Fehler wird erstellt sollte der Intent des Lex-Request nicht von der Lambdafunktion bearbeitet werden können
    throw new Error(`Intent with name ${intentName} not supported`);
}




// --------------- Main handler -----------------------


// Ist der Einstiegspunkt für die Lambdafunktion und leitet die Daten und den callback weiter
// Die JSON-Datei welche durch Lex übergeben wird ist im event

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