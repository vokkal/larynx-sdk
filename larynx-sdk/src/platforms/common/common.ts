import * as LarynxInterfaces from "../../definitions/interfaces";
import * as Alexa from "../../definitions/AlexaService";

namespace CommonClasses {
    import ISessionContext = LarynxInterfaces.ISessionContext;
    import LarynxEvent = LarynxInterfaces.LarynxEvent;
    import Frames = LarynxInterfaces.Frames;
    import FrameRedirectResponse = LarynxInterfaces.FrameRedirectResponse;
    import ActionResponseModel = LarynxInterfaces.ActionResponseModel;

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

    export class RedirectResponse implements FrameRedirectResponse {
        frameRedirect: boolean;
        result: Frames;
        index: number;

        constructor(redirected: boolean, redirectFrameName?: string, index?: number) {
            this.frameRedirect = redirected;
            if (redirectFrameName) {
                this.result = {
                    name: redirectFrameName
                };
                this.index = index ? index : 0;
            }
        }
    }

    /**
     * Model that will be used for rendering responses.
     */
    export class TemplateResponseModel implements ActionResponseModel {
        constructor(name: any, ssml: any) {
            this.responseName = name;
            this.ssml = ssml;
        }

        responseName: string;
        responseFrame: Frames;
        responseFrameIndex: number;
        ssml: {
            speech: string,
            reprompt?: string;
        };
    }
}

export = CommonClasses;