import * as LarynxInterfaces from "../../definitions/interfaces";
import * as Alexa from "../../definitions/AlexaService";

namespace CommonClasses {
    import ISessionContext = LarynxInterfaces.ISessionContext;
    import LarynxEvent = LarynxInterfaces.LarynxEvent;

    export interface LarynxEventContextOptions extends ISessionContext {
        appId: string;
    }

    export class LarynxEventContext implements LarynxEventContextOptions {
        appId: string;

        constructor(options: {ContextOptions: LarynxEventContextOptions}) {
            this.appId = options.ContextOptions.appId;
        }
    }

    /**
     * Transforms events from various services into a common format
     * Name: intent name
     * params: intent params
     */
    export class EventAdapter implements LarynxEvent {
        name: string;
        params: any;

        constructor(name: any, params: any) {
            this.name = name;
            this.params = params;
        }
    }
}

export = CommonClasses;