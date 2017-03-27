/// <reference path="./node_modules/typescript/lib/lib.es6.d.ts" />

import * as sdk from "larynx-sdk";
import {IFrame, ISessionContext} from "../larynx-sdk/lib/interfaces";
import {PartialContext} from "../larynx-sdk/lib/mixinClasses";
import {
    ActionResponseModel, Frames, LarynxEvent, LarynxEventHandler,
    FrameRedirectResponse
} from "../larynx-sdk/src/interfaces";
import {
    AlexaRequestBody, AlexaRequestType, AlexaResponseBody,
    IntentRequest, LambdaContext, RequestType, SessionEndedRequest
} from "../larynx-sdk/src/serviceDefinitions/Alexa";
import {RedirectResponse} from "../larynx-sdk/src/index";

class AlexaEventAdapter implements LarynxEvent {
    name: string;
    params: any;

    constructor(name, params) {
        this.name = name;
        this.params = params;
    }
}

class AlexaEventHandler implements LarynxEventHandler {
    constructor(event: AlexaRequestBody) {
        this.event = event;
        this.defaultFrame = {
            name: "Introduction"
        };
        this.currentFrame = event.session.attributes["currentFrame"] || this.defaultFrame;
        this.transform = function () {
            let eventName;
            let eventParams;
            let eventType = this.event.request.type;
            if (eventType === RequestType.LaunchRequest) {
                eventName = "LaunchRequest";
            } else if (eventType === RequestType.IntentRequest) {
                let eventRequest = this.event.request as IntentRequest;
                eventName = eventRequest.intent.name;
                eventParams = eventRequest.intent.slots;
            } else {
                let eventRequest = this.event.request as SessionEndedRequest;
                eventName = "SessionEndedRequest";
                eventParams = {
                    reason: eventRequest.reason,
                    error: eventRequest.error
                };
            }

            return new AlexaEventAdapter(eventName, eventParams);
        };
    };

    currentFrame: Frames;
    defaultFrame: Frames;
    event: AlexaRequestBody;
    transform: () => LarynxEvent;
}

class AlexaResponseModel implements ActionResponseModel {
    constructor(name, ssml) {
        this.responseName = name;
        this.ssml = ssml;
    }

    responseName: string;
    ssml: {
        speech: string,
        reprompt?: string;
    };
}

class SessionContextOptions {
    stuff: string;
    attributes: any;
}

class AlexaEventContext implements ISessionContext {
    stuff: string;
    attributes: any;

    // constructor can take a config object
    // the same object will be given to all mixins
    constructor(options: {ContextOptions: SessionContextOptions}) {
        this.stuff = options.ContextOptions.stuff;
        this.attributes = options.ContextOptions.attributes;
    }
}

sdk.registerFrame("Introduction", class extends AlexaEventContext implements IFrame {

    constructor(options) {
        super(options);
    };

    frameName: "Introduction";

    pre = function () {
        return new Promise(resolve => {
            resolve(new RedirectResponse(false));
        });
    };

    prompts = function () {
        return new AlexaResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
    };

    post = function () {
        return new Promise(resolve => {
            resolve();
        });
    };

    sessionEnded = function () {
        return new Promise(resolve => {
            resolve();
        });
    };
});

let larynx = sdk.initialize({});

function LambdaHandler(event: any, context: LambdaContext, callback) {
    let options = new SessionContextOptions();
    options.attributes = event.session.attributes;
    options.stuff = "world";

    let eventContext = new AlexaEventContext({ContextOptions: options});

    let eventHandler = new AlexaEventHandler(event);

    let larynxEvent = eventHandler.transform();

    let currentFrame = larynx.Frames[eventHandler.currentFrame.name];

    sdk.LarynxEventHandler(larynxEvent, currentFrame, eventContext).then(response => {
        console.log("Response: " + JSON.stringify(response, undefined, 4));
    });
};


export const handler = LambdaHandler;


let event = {
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
