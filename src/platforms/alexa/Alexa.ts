import * as LarynxInterfaces from "../../definitions/interfaces";
import * as CommonClasses from "../common/common";
import * as AlexaService from "../../definitions/AlexaService";
namespace AlexaClasses {
    import EventAdapter = CommonClasses.EventAdapter;
    import Frames = LarynxInterfaces.Frames;
    import LarynxEvent = LarynxInterfaces.LarynxEvent;
    import LarynxEventContextOptions = CommonClasses.LarynxEventContextOptions;
    import LarynxEventHandler = LarynxInterfaces.LarynxEventHandler;
    import LarynxEventContext = CommonClasses.LarynxEventContext;
    import AlexaRequestBody = AlexaService.AlexaRequestBody;
    import RequestType = AlexaService.RequestType;
    import IntentRequest = AlexaService.IntentRequest;
    import SessionEndedRequest = AlexaService.SessionEndedRequest;
    import Actions = LarynxInterfaces.Actions;

    export interface AlexaContextOptions extends LarynxEventContextOptions {
    }

    export class AlexaContext extends LarynxEventContext implements AlexaContextOptions {
        constructor(options: {ContextOptions: AlexaContextOptions}) {
            super(options);
        }
    }

    /**
     * Transforms an Alexa request body into a common format for Larynx
     */
    export class AlexaRequestAdapter implements LarynxEventHandler {
        constructor(requestBody: AlexaRequestBody, defaultFrame: Frames) {
            this.defaultFrame = defaultFrame;
            this.currentFrame = requestBody.session.attributes["currentFrame"] || this.defaultFrame;
            this.currentFrameIndex = requestBody.session.attributes["currentFrameIndex"] || 0;
            this.waitingForTransition = requestBody.session.attributes["waitingForTransition"];
            this.transform(requestBody);
        };

        /**
         * Tranform the event into common event names and params format
         * @returns {EventAdapter}
         */
        transform = function (event: AlexaRequestBody) {
            let eventAction: Actions = {
                name: ""
            };
            let eventParams = {};
            let eventType = event.request.type;
            if (eventType === RequestType.LaunchRequest) {
                eventAction.name = "LaunchRequest";
            } else if (eventType === RequestType.IntentRequest) {
                let eventRequest = event.request as IntentRequest;
                eventAction.name = eventRequest.intent.name;
                eventParams = eventRequest.intent.slots;
            } else {
                let eventRequest = event.request as SessionEndedRequest;
                eventAction.name = "SessionEndedRequest";
                eventParams = {
                    reason: eventRequest.reason,
                    error: eventRequest.error
                };
            }

            return new EventAdapter(eventAction, eventParams);
        };
        currentFrame: Frames;
        currentFrameIndex: number;
        defaultFrame: Frames;
        event: EventAdapter;
        waitingForTransition: boolean;
    }
}

export = AlexaClasses;

