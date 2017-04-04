import larynx = require("./interfaces");
import IFrame = larynx.IFrame;
import Frames = larynx.Frames;
import FrameRedirectResponse = larynx.FrameRedirectResponse;
import ActionResponseModel = larynx.ActionResponseModel;
import ActionHandlers = larynx.ActionHandlers;
import ISessionContext = larynx.ISessionContext;

export class PartialIFrame implements IFrame {
    constructor(options: {FrameOptions: IFrame}) {
        this.pre = options.FrameOptions.pre;
        this.prompts = options.FrameOptions.prompts;
        this.transitions = options.FrameOptions.transitions;
        this.post = options.FrameOptions.post;
        this.sessionEnded = options.FrameOptions.sessionEnded;
    }
    pre: () => Promise<FrameRedirectResponse>;
    prompts: ActionResponseModel  |
        (() => Promise<ActionResponseModel> ) |
        (() => ActionResponseModel ) |
        (Array<ActionResponseModel | (() => Promise<ActionResponseModel>) | (() => ActionResponseModel)>);
    transitions?: ActionHandlers;
    post: () => Promise<FrameRedirectResponse>;
    sessionEnded: () => Promise<any>;
}

export class PartialContext implements ISessionContext {

    // constructor can take a config object
    // the same object will be given to all mixins
    constructor(options: {ContextOptions: ISessionContext}) {
    }

    // add method stubs here,
    // at runtime, apply mixins for the current frame and context
    // then handle event
}

export interface IFrameContext extends PartialContext {
    new(options?: {ContextOptions: ISessionContext}): IFrameContext;
    (options?: {ContextOptions: ISessionContext}): void;
}