/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />

import larynx = require("./interfaces");
import Frames = larynx.Frames;
import Actions = larynx.Actions;
import ISessionContext = larynx.ISessionContext;
import IFrame = larynx.IFrame;
import {ActionResponseModel, CreatesFrame, FrameRedirectResponse, LarynxEvent} from "./interfaces";

let _redirectLimit = 10;

let _larynxFrames: {[key: string]: Array<CreatesFrame> } = {};
let _larynxActions: {[key: string]: Actions; } = {};


export const initialize = function (options: any) {
    return {
        Frames: _larynxFrames,
        Actions: _larynxActions
    };
};

export const registerFrame = function (FrameName: string, FrameImpl: new (options: {ContextOptions: ISessionContext}) => IFrame) {
    if (!_larynxFrames[FrameName]) {
        _larynxFrames[FrameName] = [FrameImpl];
    } else {
        _larynxFrames[FrameName].push(FrameImpl);
    }
};

export const LarynxEventHandler = async function (event: LarynxEvent, frame: Array<CreatesFrame>, options: ISessionContext): Promise<ActionResponseModel> {

    let frameImpl = new frame[Math.floor(Math.random() * frame.length)]({ContextOptions: options});

    let redirect = true;
    let count = 0;
    let response = new RedirectResponse(false);
    while (redirect) {
        let response = await checkForRedirect(frameImpl);

        if (response.err) {
            console.log(`Redirect error: ${response.err}, ${response.err.message}`);
            throw response.err;
        } else if (count >= _redirectLimit) {
            console.log(`Redirect error: too many redirects`);
            throw new Error("Too many redirects!");
        }

        if (response.frameRedirect) {
            console.log("Redirection! => " + response.result.name);
            let newFrames = _larynxFrames[response.result.name];
            frameImpl = new newFrames[Math.floor(Math.random() * newFrames.length)]({ContextOptions: options});
            count++;
        }
    }

    return getResponseModel(frameImpl.prompts);
};

async function getResponseModel(prompts: ActionResponseModel  | (() => Promise<ActionResponseModel> ) | (() => ActionResponseModel ) |
    (Array<ActionResponseModel | (() => Promise<ActionResponseModel>) | (() => ActionResponseModel)>)): Promise<ActionResponseModel> {

    if (prompts instanceof Array) {
        let prompt = prompts[Math.floor(Math.random() * prompts.length)];
        return resolvePrompt(prompt);
    } else {
        return resolvePrompt(prompts); // TODO: await here?
    }
}

async function resolvePrompt(prompt: ActionResponseModel  | (() => Promise<ActionResponseModel> ) | (() => ActionResponseModel )): Promise<ActionResponseModel> {
    try {
        if (instanceOfActionResponseModel(prompt)) {
            return prompt;
        } else if (isPromise(prompt)) {
            return await prompt();
        } else if (isFunction(prompt)) {
            return prompt();
        }
    } catch (err) {
        throw new Error("Error resolving prompt!" + err);
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
        return await frame.pre();
    } else {
        return new RedirectResponse(false);
    }
}

export class RedirectResponse implements FrameRedirectResponse {
    frameRedirect: boolean;

    constructor(redirected: boolean) {
        this.frameRedirect = redirected;
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