/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
var _redirectLimit = 10;
var _larynxFrames = {};
var _larynxActions = {};
exports.initialize = function (options) {
    return {
        Frames: _larynxFrames,
        Actions: _larynxActions
    };
};
exports.registerFrame = function (FrameName, FrameImpl) {
    if (!_larynxFrames[FrameName]) {
        _larynxFrames[FrameName] = [FrameImpl];
    }
    else {
        _larynxFrames[FrameName].push(FrameImpl);
    }
};
exports.LarynxEventHandler = function (event, frame, options) {
    return __awaiter(this, void 0, Promise, function* () {
        var frameImpl = new frame[Math.floor(Math.random() * frame.length)]({ ContextOptions: options });
        var redirect = true;
        var count = 0;
        var response = new RedirectResponse(false);
        while (redirect) {
            var response_1 = yield checkForRedirect(frameImpl);
            if (response_1.err) {
                console.log("Redirect error: " + response_1.err + ", " + response_1.err.message);
                throw response_1.err;
            }
            else if (count >= _redirectLimit) {
                console.log("Redirect error: too many redirects");
                throw new Error("Too many redirects!");
            }
            if (response_1.frameRedirect) {
                console.log("Redirection! => " + response_1.result.name);
                var newFrames = _larynxFrames[response_1.result.name];
                frameImpl = new newFrames[Math.floor(Math.random() * newFrames.length)]({ ContextOptions: options });
                count++;
            }
        }
        return getResponseModel(frameImpl.prompts);
    });
};
function getResponseModel(prompts) {
    return __awaiter(this, void 0, Promise, function* () {
        if (prompts instanceof Array) {
            var prompt_1 = prompts[Math.floor(Math.random() * prompts.length)];
            return resolvePrompt(prompt_1);
        }
        else {
            return resolvePrompt(prompts); // TODO: await here?
        }
    });
}
function resolvePrompt(prompt) {
    return __awaiter(this, void 0, Promise, function* () {
        try {
            if (instanceOfActionResponseModel(prompt)) {
                return prompt;
            }
            else if (isPromise(prompt)) {
                return yield prompt();
            }
            else if (isFunction(prompt)) {
                return prompt();
            }
        }
        catch (err) {
            throw new Error("Error resolving prompt!" + err);
        }
    });
}
function instanceOfActionResponseModel(object) {
    return "responseName" in object;
}
function isFunction(func) {
    return func && {}.toString.call(func) === "[object Function]";
}
function isPromise(func) {
    return isFunction(func) && func.then && isFunction(func.then);
}
function checkForRedirect(frame) {
    return __awaiter(this, void 0, Promise, function* () {
        if (frame.pre) {
            return yield frame.pre();
        }
        else {
            return new RedirectResponse(false);
        }
    });
}
var RedirectResponse = (function () {
    function RedirectResponse(redirected) {
        this.frameRedirect = redirected;
    }
    return RedirectResponse;
}());
exports.RedirectResponse = RedirectResponse;
/**
 * Copy properties of source object to target object excluding constructor.
 * If a property with the same exists on the target it is NOT overwritten.
 *
 * @param target
 * @param source
 */
function extend(target, source) {
    Object.getOwnPropertyNames(source).forEach(function (name) {
        if (name !== "constructor" && !target.hasOwnProperty(name)) {
            Object.defineProperty(target, name, Object.getOwnPropertyDescriptor(source, name));
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
function compose(defaultOptions, mixins) {
    // our constructor function that will be called every time a new composed object is created
    var ctor = function (options) {
        var _this = this;
        var o = {};
        // clone options given to the constructor
        if (options) {
            extend(o, options);
        }
        // complete with the defaultOptions
        if (defaultOptions) {
            extend(o, defaultOptions);
        }
        // call the constructor function of all the mixins
        mixins.forEach(function (mixin) {
            mixin.call(_this, o);
        });
    };
    // add all mixins properties and methods to the constructor prototype for all
    // created objects to have them
    mixins.forEach(function (mixin) {
        extend(ctor.prototype, mixin.prototype);
    });
    return ctor;
}
