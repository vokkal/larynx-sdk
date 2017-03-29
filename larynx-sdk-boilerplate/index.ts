/// <reference path="./node_modules/typescript/lib/lib.es6.d.ts" />

import * as sdk from "larynx-sdk";
import {IFrame, ISessionContext} from "../larynx-sdk/lib/interfaces";
import * as fs from "fs";
import {
    ActionResponseModel, Frames, LarynxEvent, LarynxEventHandler,
    FrameRedirectResponse
} from "../larynx-sdk/src/interfaces";
import {
    AlexaRequestBody, AlexaRequestType, AlexaResponseBody,
    IntentRequest, LambdaContext, RequestType, SessionEndedRequest, Response
} from "../larynx-sdk/src/serviceDefinitions/Alexa";
import {RedirectResponse} from "../larynx-sdk/src/index";

let pug = require("pug");
let parser = require('xml2json');

/**
 * Transforms events from various services into a common format
 * Name: intent name
 * params: intent params
 */
class EventAdapter implements LarynxEvent {
    name: string;
    params: any;

    constructor(name: any, params: any) {
        this.name = name;
        this.params = params;
    }
}


/**
 * Transforms an Alexa request body into a common format for Larynx
 */
class AlexaRequestHandler implements LarynxEventHandler {
    constructor(event: AlexaRequestBody) {
        this.event = event;
        this.defaultFrame = {
            name: "redirect"
        };
        this.currentFrame = event.session.attributes["currentFrame"] || this.defaultFrame;

        /**
         * Tranform the event into common event names and params format
         * @returns {EventAdapter}
         */
        this.transform = function () {
            let eventName = "";
            let eventParams = {};
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

            return new EventAdapter(eventName, eventParams);
        };
    };

    currentFrame: Frames;
    defaultFrame: Frames;
    event: AlexaRequestBody;
    transform: () => LarynxEvent;
}

/**
 * Model that will be used for rendering responses.
 */
class ResponseModel implements ActionResponseModel {
    constructor(name: any, ssml: any) {
        this.responseName = name;
        this.ssml = ssml;
    }

    responseName: string;
    ssml: {
        speech: string,
        reprompt?: string;
    };
}

/**
 * Context options class. Will be passed as parameter for constructor of Event context
 */
class SessionContextOptions {
    stuff: string;
    attributes: any;
}

/**
 * Defines attributes that will be available in each Frame
 */
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


/**
 * Register a basic frame. Has no intent handlers so will end the session. (TODO)
 */
sdk.registerFrame("Introduction", class extends AlexaEventContext implements IFrame {

    constructor(options: any) {
        super(options);
    };

    frameName: "Introduction";

    pre = function () {
        return new Promise(resolve => {
            resolve(new RedirectResponse(false));
        });
    };

    prompts = function () {
        return new ResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
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


/**
 * Empty frame to test redirect in pre-exec function. Use pre() to check for any preconditions needed for
 * prompt handlers
 */
sdk.registerFrame("redirect", class extends AlexaEventContext implements IFrame {

    constructor(options: any) {
        super(options);
    };

    frameName: "redirect";

    pre = function () {
        return new Promise(resolve => {
            resolve(new RedirectResponse(true, "Introduction"));
        });
    };

    prompts = function () {
        return new ResponseModel("hello world", "<speak>redirected...</speak>");
    };

    sessionEnded = function () {
        return new Promise(resolve => {
            resolve();
        });
    };
});

let larynx = sdk.initialize({});

async function LambdaHandler(event: any, context: LambdaContext, callback: any) {

    // Define attributes that will be available in each frame
    let options = new SessionContextOptions();
    options.attributes = event.session.attributes;
    options.stuff = "world";

    // Build an Alexa event context
    // Use a different event context builder for another service (e.g. Google)
    let eventContext = new AlexaEventContext({ContextOptions: options});

    // Build request handler
    let requestHandler = new AlexaRequestHandler(event);

    let larynxEvent = requestHandler.transform();

    // Find the currently active frame or the default
    let currentFrame = larynx.Frames[requestHandler.currentFrame.name];

    try {
        let responseData = await sdk.LarynxEventHandler(larynxEvent, currentFrame, eventContext);

        let template = fs.readFileSync("./templates/alexa/response.pug");

        let rendered = pug.render(template, responseData);

        let responseObj = JSON.parse(parser.toJson(rendered));

        let r = new AlexaResponse();
        r.response = responseObj.response;
        r.sessionAttributes = options.attributes;
        r.version = "1.0";

        console.log("alexa response -> %j", r);

    } catch (err) {
        console.log("error: " + err)
    }
}

class AlexaResponse implements AlexaResponseBody {
    sessionAttributes: any[];
    response: Response;
    version: string;
}

// export const handler = LambdaHandler;


let event = {
    "session": {
        "sessionId": "SessionId.2b19282c-0dd7-4bb4-8ddf-faf92879abce",
        "application": {
            "applicationId": "amzn1.echo-sdk-ams.app.61df91bc-a5f9-4c5f-9436-91b5c5694ca4"
        },
        "attributes": {"aval": "valll"},
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
