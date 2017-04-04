declare namespace LarynxInterfaces {

    export interface Frames {
        name: string;
    }

    export interface Actions {
        name: string;
    }

    export interface LarynxEvent {
        name: string;
        params: any;
    }

    export interface LarynxEventHandler {
        currentFrame: Frames;
        defaultFrame: Frames;
        transform: () => LarynxEvent |
            (() => Promise<LarynxEvent>);
    }

    export interface RequestBody {
    }

    export interface FrameRedirectResponse {
        frameRedirect: boolean;
        err?: Error;
        result?: Frames;
    }

    export interface NamedAction {
        action: Actions;
        handler: () => Frames |
            Frames |
            (() => Promise<Frames>);
    }

    export interface GenericAction {
        handler: () => Frames |
            Frames |
            (() => Promise<Frames>);
    }

    export interface ActionResponseModel {
        isActive?: boolean | Promise<boolean>; // check if this model can be rendered in the current context
        responseName: string;
        responseFrame: Frames;
    }

    export interface ActionHandlers {
        actions?: NamedAction | Array<NamedAction>;
        unhandled: GenericAction;
    }

    export interface ISessionContext {
    }

    export interface CreatesFrame {
        new (options: {ContextOptions: ISessionContext}): IFrame;
    }

    export interface IFrame {
        pre?: () => Promise<FrameRedirectResponse>;
        prompts?: ActionResponseModel  |
            (() => Promise<ActionResponseModel> ) |
            (() => ActionResponseModel ) |
            (Array<ActionResponseModel | (() => Promise<ActionResponseModel>) | (() => ActionResponseModel)>);
        transitions?: ActionHandlers;
        post?: () => Promise<FrameRedirectResponse>;
        sessionEnded: () => Promise<any>;
    }

    export interface IEventContainer {
        frameId: Frames;
        impl: CreatesFrame;
        targets: Array<Frames>;
    }

}
export = LarynxInterfaces;
export as namespace LarynxInterfaces;