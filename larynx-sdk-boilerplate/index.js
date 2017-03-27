/// <reference path="./node_modules/typescript/lib/lib.es6.d.ts" />
"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var sdk = require("larynx-sdk");
var Alexa_1 = require("../larynx-sdk/src/serviceDefinitions/Alexa");
var index_1 = require("../larynx-sdk/src/index");
var AlexaEventAdapter = (function () {
    function AlexaEventAdapter(name, params) {
        this.name = name;
        this.params = params;
    }
    return AlexaEventAdapter;
}());
var AlexaEventHandler = (function () {
    function AlexaEventHandler(event) {
        this.event = event;
        this.defaultFrame = {
            name: "Introduction"
        };
        this.currentFrame = event.session.attributes["currentFrame"] || this.defaultFrame;
        this.transform = function () {
            var eventName;
            var eventParams;
            var eventType = this.event.request.type;
            if (eventType === Alexa_1.RequestType.LaunchRequest) {
                eventName = "LaunchRequest";
            }
            else if (eventType === Alexa_1.RequestType.IntentRequest) {
                var eventRequest = this.event.request;
                eventName = eventRequest.intent.name;
                eventParams = eventRequest.intent.slots;
            }
            else {
                var eventRequest = this.event.request;
                eventName = "SessionEndedRequest";
                eventParams = {
                    reason: eventRequest.reason,
                    error: eventRequest.error
                };
            }
            return new AlexaEventAdapter(eventName, eventParams);
        };
    }
    ;
    return AlexaEventHandler;
}());
var AlexaResponseModel = (function () {
    function AlexaResponseModel(name, ssml) {
        this.responseName = name;
        this.ssml = ssml;
    }
    return AlexaResponseModel;
}());
var SessionContextOptions = (function () {
    function SessionContextOptions() {
    }
    return SessionContextOptions;
}());
var AlexaEventContext = (function () {
    // constructor can take a config object
    // the same object will be given to all mixins
    function AlexaEventContext(options) {
        this.stuff = options.ContextOptions.stuff;
        this.attributes = options.ContextOptions.attributes;
    }
    return AlexaEventContext;
}());
sdk.registerFrame("Introduction", (function (_super) {
    __extends(class_1, _super);
    function class_1(options) {
        _super.call(this, options);
        this.pre = function () {
            return new Promise(function (resolve) {
                resolve(new index_1.RedirectResponse(false));
            });
        };
        this.prompts = function () {
            return new AlexaResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
        };
        this.post = function () {
            return new Promise(function (resolve) {
                resolve();
            });
        };
        this.sessionEnded = function () {
            return new Promise(function (resolve) {
                resolve();
            });
        };
    }
    ;
    return class_1;
}(AlexaEventContext)));
var larynx = sdk.initialize({});
function LambdaHandler(event, context, callback) {
    var options = new SessionContextOptions();
    options.attributes = event.session.attributes;
    options.stuff = "world";
    var eventContext = new AlexaEventContext({ ContextOptions: options });
    var eventHandler = new AlexaEventHandler(event);
    var larynxEvent = eventHandler.transform();
    var currentFrame = larynx.Frames[eventHandler.currentFrame.name];
    sdk.LarynxEventHandler(larynxEvent, currentFrame, eventContext).then(function (response) {
        console.log("Response: " + JSON.stringify(response, undefined, 4));
    });
}
;
exports.handler = LambdaHandler;
var event = {
    "session": {
        "sessionId": "SessionId.2b19282c-0dd7-4bb4-8ddf-faf92879abce",
        "application": {
            "applicationId": "amzn1.echo-sdk-ams.app.61df91bc-a5f9-4c5f-9436-91b5c5694ca4"
        },
        "attributes": {},
        "user": {
            "userId": "amzn1.account.AFOQLP3TRKTIAN45J5LRLLELIVTQ"
        },
        "new": true
    },
    "request": {
        "type": "IntentRequest",
        "requestId": "EdwRequestId.15df9c9e-11cc-4f82-b57b-21772ff64241",
        "locale": "en-US",
        "timestamp": "2017-03-25T23:28:37Z",
        "intent": {
            "name": "RepeatFactIntent",
            "slots": {}
        }
    },
    "version": "1.0"
};
LambdaHandler(event, undefined, undefined);
