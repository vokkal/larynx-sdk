export import LarynxInterfaces = require("./definitions/interfaces");
export import AlexaService = require("./definitions/AlexaService");
export import AlexaClasses = require("./platforms/alexa/Alexa");
export import CommonClasses = require("./platforms/common/common");
export import LarynxClasses = require("./platforms/implementations");

import RedirectResponse = CommonClasses.RedirectResponse;
import ActionResponseModel = LarynxInterfaces.ActionResponseModel;
import Actions = LarynxInterfaces.Actions;
import FrameRedirectResponse = LarynxInterfaces.FrameRedirectResponse;
import IEventContainer = LarynxInterfaces.IEventContainer;
import IFrame = LarynxInterfaces.IFrame;
import ISessionContext = LarynxInterfaces.ISessionContext;
import LarynxEventHandler = LarynxInterfaces.LarynxEventHandler;
import GenericAction = LarynxInterfaces.GenericAction;
import NamedAction = LarynxInterfaces.NamedAction;
import Frames = LarynxInterfaces.Frames;

let pug = require("pug");
let parser = require("xml2json");

let _redirectLimit = 10;
let _instance: any = undefined;

function props(options: any) {
    let _larynxFrames: {[key: string]: Array<IEventContainer>} = {};
    let _larynxActions: {[key: string]: Actions} = {};

    return {
        Frames: _larynxFrames,
        Actions: _larynxActions,
        Register: function (frame: IEventContainer): void {
            if (!_larynxFrames[frame.frameId.name]) {
                _larynxFrames[frame.frameId.name] = [frame];
            } else {
                _larynxFrames[frame.frameId.name].push(frame);
            }
        },
        Render: function (template: string, model: ActionResponseModel): any {
            return JSON.parse(parser.toJson(pug.render(template, model)));
        },
        HandleEvent: async function (eventHandler: LarynxEventHandler, options: ISessionContext): Promise<ActionResponseModel> {
            let frameId = eventHandler.currentFrame;
            let frameIndex = eventHandler.currentFrameIndex;

            let frameArr = _larynxFrames[frameId.name];
            let frameContainer = frameArr[frameIndex ? frameIndex : (Math.floor(Math.random() * frameArr.length))];
            let frameImpl = new frameContainer.impl({ContextOptions: options});

            if (eventHandler.waitingForTransition && !!frameImpl.transitions) {
                let actionHandlers = frameImpl.transitions;
                let newFrame: Frames;
                if (!actionHandlers.actions) {
                    newFrame = await resolveAction.call(this, actionHandlers.unhandled);
                } else {
                    newFrame = await getAction.call(this, actionHandlers.actions);
                }
                let newFrames = _larynxFrames[newFrame.name];
                frameIndex = Math.floor(Math.random() * newFrames.length);
                frameImpl = new newFrames[frameIndex].impl({ContextOptions: options});
                frameId = newFrame;
            } else if (eventHandler.waitingForTransition && !frameImpl.transitions) {
                throw new Error("Expecting transitions but none defined!");
            } else if (!eventHandler.waitingForTransition && !frameImpl.prompts && !frameImpl.pre) {
                throw new Error(`Expecting prompts but none defined in frame: ${frameId.name}!`);
            }

            return await getActionResponse(eventHandler, options, frameImpl, frameIndex, frameId);
        }
    };

    async function getActionResponse(eventHandler: LarynxEventHandler, options: ISessionContext, frameImpl: IFrame, frameIndex: number, frameId: Frames) {
        let redirect = true;
        let count = 0;
        let response = new RedirectResponse(false);

        let redirectPath = eventHandler.currentFrame.name;
        while (redirect) {
            let response = await checkForRedirect.call(frameImpl, frameImpl);

            if (response.err) {
                console.log(`Redirect error: ${response.err}, ${response.err.message}`);
                throw response.err;
            } else if (count >= _redirectLimit) {
                throw new Error("Too many redirects!\n" + redirectPath);
            }

            if (response.frameRedirect) {
                redirectPath += " => " + response.result.name;
                let newFrames = _larynxFrames[response.result.name];
                frameIndex = Math.floor(Math.random() * newFrames.length);
                frameImpl = new newFrames[frameIndex].impl({ContextOptions: options});
                frameId = response.result;
                count++;
            } else {
                redirect = false;
            }
        }

        let responseModel = await getResponseModel.call(frameImpl, frameImpl.prompts);
        responseModel.responseFrame = frameId;
        responseModel.responseFrameIndex = frameIndex;
        responseModel.endsSession = !!frameImpl.transitions;
        return responseModel;
    }
}

async function getResponseModel(prompts: ActionResponseModel  | (() => Promise<ActionResponseModel> ) | (() => ActionResponseModel ) |
    (Array<ActionResponseModel | (() => Promise<ActionResponseModel>) | (() => ActionResponseModel)>)): Promise<ActionResponseModel> {

    if (prompts instanceof Array) {
        let prompt = prompts[Math.floor(Math.random() * prompts.length)];
        return resolvePrompt.call(this, prompt);
    } else {
        return resolvePrompt.call(this, prompts); // TODO: await here?
    }
}

async function getAction(actions: NamedAction | Array<NamedAction>) {
    if (actions instanceof Array) {
        let action = actions[Math.floor(Math.random() * actions.length)];
        return resolveAction.call(this, action);
    } else {
        return resolveAction.call(this, actions); // TODO: await here?
    }
}

async function resolveAction(action: () => Frames | Frames | (() => Promise<Frames>)): Promise<Frames> {
    try {
        if (instanceOfGenericAction(action()) || instanceOfNamedAction(action)) {
            return action;
        } else if (isPromise(action)) {
            return await action.call(this);
        } else if (isFunction(action)) {
            return action.call(this);
        }
    } catch (err) {
        throw new Error("Error resolving action! " + err);
    }
}

async function resolvePrompt(prompt: ActionResponseModel  | (() => Promise<ActionResponseModel> ) | (() => ActionResponseModel )): Promise<ActionResponseModel> {
    try {
        if (instanceOfActionResponseModel(prompt)) {
            return prompt;
        } else if (isPromise(prompt)) {
            return await prompt.call(this);
        } else if (isFunction(prompt)) {
            return prompt.call(this);
        }
    } catch (err) {
        throw new Error("Error resolving prompt! " + err);
    }
}

function instanceOfActionResponseModel(object: any): object is ActionResponseModel {
    return "responseName" in object;
}

function instanceOfGenericAction(object: any): object is GenericAction {
    return "handler" in object;
}

function instanceOfNamedAction(object: any): object is NamedAction {
    return "handler" in object && "action" in object;
}

function isFunction(func: any) {
    return func && {}.toString.call(func) === "[object Function]";
}

function isPromise(func: any) {
    return isFunction(func) && func.then && isFunction(func.then);
}

async function checkForRedirect(frame: IFrame): Promise<FrameRedirectResponse> {
    if (frame.pre) {
        return await frame.pre.call(this);
    } else {
        return new RedirectResponse(false);
    }
}


export function initialize(options: any): any {
    if (!_instance || options.reset) {
        _instance = props(options);
    }

    return _instance;
}