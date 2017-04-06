
import * as CommonClasses from "../common/common";
import {RequestType} from "../../definitions/Alexa";
import * as Alexa from "../../definitions/AlexaService";

namespace AlexaClasses {
    import EventAdapter = CommonClasses.EventAdapter;
    import Frames = LarynxInterfaces.Frames;
    import IntentRequest = Alexa.IntentRequest;
    import LarynxEvent = LarynxInterfaces.LarynxEvent;
    import LarynxEventContext = CommonClasses.LarynxEventContext;
    import LarynxEventContextOptions = CommonClasses.LarynxEventContextOptions;
    import LarynxEventHandler = LarynxInterfaces.LarynxEventHandler;
    import SessionEndedRequest = Alexa.SessionEndedRequest;
    import AlexaRequestBody = Alexa.AlexaRequestBody;

    interface AlexaContextOptions extends LarynxEventContextOptions {
    }

    class AlexaContext extends LarynxEventContext implements AlexaContextOptions {
        constructor(options: {ContextOptions: AlexaContextOptions}) {
            super(options);
        }
    }

    /**
     * Transforms an Alexa request body into a common format for Larynx
     */
    class AlexaRequestAdapter implements LarynxEventHandler {
        constructor(event: AlexaRequestBody) {
            this.event = event;
            this.defaultFrame = {
                name: "redirect"
            };
            this.currentFrame = event.session.attributes["currentFrame"] || this.defaultFrame;
            this.currentFrameIndex = event.session.attributes["currentFrameIndex"] || 0;

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
        currentFrameIndex: number;
        defaultFrame: Frames;
        event: AlexaRequestBody;
        transform: () => LarynxEvent;
    }
}

export = AlexaClasses;