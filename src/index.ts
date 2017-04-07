import ActionResponseModel = LarynxInterfaces.ActionResponseModel;
import Actions = LarynxInterfaces.Actions;
import FrameRedirectResponse = LarynxInterfaces.FrameRedirectResponse;
import IEventContainer = LarynxInterfaces.IEventContainer;
import IFrame = LarynxInterfaces.IFrame;
import ISessionContext = LarynxInterfaces.ISessionContext;
import LarynxEventHandler = LarynxInterfaces.LarynxEventHandler;
import RedirectResponse = CommonClasses.RedirectResponse;

let pug = require("pug");
let parser = require("xml2json");

let _redirectLimit = 10;
let _instance: any = undefined;

export default (options: any) => {
    if (!_instance) {
        _instance = initialize(options);
    }

    return _instance;
};

function initialize(options: any) {
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
            return responseModel;
        }
    };
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