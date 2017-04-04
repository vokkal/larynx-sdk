/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

import * as util from "util";
import * as LarynxClasses from "./implementations";
import * as LarynxInterfaces from "./interfaces";

import CreatesFrame = LarynxInterfaces.CreatesFrame;
import Actions = LarynxInterfaces.Actions;
import LarynxEvent = LarynxInterfaces.LarynxEvent;
import Frames = LarynxInterfaces.Frames;
import ISessionContext = LarynxInterfaces.ISessionContext;
import ActionResponseModel = LarynxInterfaces.ActionResponseModel;
import FrameRedirectResponse = LarynxInterfaces.FrameRedirectResponse;
import IFrame = LarynxInterfaces.IFrame;
import EventContainer = LarynxClasses.EventContainer;
import IEventContainer = LarynxInterfaces.IEventContainer;

let _redirectLimit = 10;

let _larynxFrames: {[key: string]: Array<IEventContainer>} = {};
let _larynxActions: {[key: string]: Actions} = {};


export const initialize = function (options: any) {

    return {
        Frames: _larynxFrames,
        Actions: _larynxActions,
        Register: register
    };
};

function register(frame: IEventContainer): void {
    if (!_larynxFrames[frame.frameId.name]) {
        _larynxFrames[frame.frameId.name] = [frame];
    } else {
        _larynxFrames[frame.frameId.name].push(frame);
    }
}

export const LarynxEventHandler = async function (event: LarynxEvent, frameId: Frames, options: ISessionContext): Promise<ActionResponseModel> {

    let frame = _larynxFrames[frameId.name];
    let frameImpl = new frame[Math.floor(Math.random() * frame.length)].impl({ContextOptions: options});

    // console.log("frame: " + util.inspect(frameImpl));
    let redirect = true;
    let count = 0;
    let response = new RedirectResponse(false);

    console.log("checking redirect...");
    while (redirect) {
        let response = await checkForRedirect.call(frameImpl, frameImpl);

        if (response.err) {
            console.log(`Redirect error: ${response.err}, ${response.err.message}`);
            throw response.err;
        } else if (count >= _redirectLimit) {
            console.log(`Redirect error: too many redirects`);
            throw new Error("Too many redirects! Check for loops!");
        }

        if (response.frameRedirect) {
            console.log("Redirection! => " + response.result.name);
            let newFrames = _larynxFrames[response.result.name];
            frameImpl = new newFrames[Math.floor(Math.random() * newFrames.length)].impl({ContextOptions: options});

            count++;
        } else {
            redirect = false;
        }
    }

    let responseModel = await getResponseModel.call(frameImpl, frameImpl.prompts);
    responseModel.responseFrame = frameId.name;
    return responseModel;
};

async function getResponseModel(prompts: ActionResponseModel  | (() => Promise<ActionResponseModel> ) | (() => ActionResponseModel ) |
    (Array<ActionResponseModel | (() => Promise<ActionResponseModel>) | (() => ActionResponseModel)>)): Promise<ActionResponseModel> {

    if (prompts instanceof Array) {
        let prompt = prompts[Math.floor(Math.random() * prompts.length)];
        return resolvePrompt.call(this, prompt);
    } else {
        return resolvePrompt.call(this, prompts); // TODO: await here?
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

export class RedirectResponse implements FrameRedirectResponse {
    frameRedirect: boolean;
    result: Frames;

    constructor(redirected: boolean, redirectFrameName?: string) {
        this.frameRedirect = redirected;
        if (redirectFrameName) {
            this.result = {
                name: redirectFrameName
            };
        }
    }
}

/**
 * Copy properties of source object to target object excluding constructor.
 * If a property with the same exists on the target it is NOT overwritten.
 *
 * @param target
 * @param source
 */
function extend(target: any, source: any) {
    Object.getOwnPropertyNames(source).forEach(name => {
        if (name !== "constructor" && !target.hasOwnProperty(name)) {
            Object.defineProperty(target, name,
                Object.getOwnPropertyDescriptor(source, name));
        }
    });
}


/**
 * Create a constructor function for a class implementing the given mixins.
 *
 * @param defaultOptions options that will be used if some options are missing at construction time
 * @param mixins array of classes to be mixed together. The constructor of those classes will receive the options given
 *               to the constructor of the composed object
 * @returns {{new(any): {}}} a constructor function
 */
function compose(defaultOptions: any, mixins: any[]) {

    // our constructor function that will be called every time a new composed object is created
    let ctor = function (options: any) {
        let o = {};
        // clone options given to the constructor
        if (options) {
            extend(o, options);
        }
        // complete with the defaultOptions
        if (defaultOptions) {
            extend(o, defaultOptions);
        }

        // call the constructor function of all the mixins
        mixins.forEach(mixin => {
            mixin.call(this, o);
        });
    };

    // add all mixins properties and methods to the constructor prototype for all
    // created objects to have them
    mixins.forEach(mixin => {
        extend(ctor.prototype, mixin.prototype);
    });

    return ctor;
}