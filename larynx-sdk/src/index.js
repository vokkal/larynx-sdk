/// <reference path="../node_modules/typescript/lib/lib.es6.d.ts" />
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
    return { next: verb(0), "throw": verb(1), "return": verb(2) };
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
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
    return __awaiter(this, void 0, void 0, function () {
        var frameImpl, redirect, count, response, response_1, newFrames;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    frameImpl = new frame[Math.floor(Math.random() * frame.length)]({ ContextOptions: options });
                    redirect = true;
                    count = 0;
                    response = new RedirectResponse(false);
                    console.log("checking redirect...");
                    _a.label = 1;
                case 1:
                    if (!redirect) return [3 /*break*/, 3];
                    return [4 /*yield*/, checkForRedirect(frameImpl)];
                case 2:
                    response_1 = _a.sent();
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
                        newFrames = _larynxFrames[response_1.result.name];
                        frameImpl = new newFrames[Math.floor(Math.random() * newFrames.length)]({ ContextOptions: options });
                        count++;
                    }
                    else {
                        redirect = false;
                    }
                    return [3 /*break*/, 1];
                case 3: return [2 /*return*/, getResponseModel.call(frameImpl, frameImpl.prompts)];
            }
        });
    });
};
function getResponseModel(prompts) {
    return __awaiter(this, void 0, void 0, function () {
        var prompt_1;
        return __generator(this, function (_a) {
            if (prompts instanceof Array) {
                prompt_1 = prompts[Math.floor(Math.random() * prompts.length)];
                return [2 /*return*/, resolvePrompt.call(this, prompt_1)];
            }
            else {
                return [2 /*return*/, resolvePrompt.call(this, prompts)]; // TODO: await here?
            }
            return [2 /*return*/];
        });
    });
}
function resolvePrompt(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!instanceOfActionResponseModel(prompt)) return [3 /*break*/, 1];
                    return [2 /*return*/, prompt];
                case 1:
                    if (!isPromise(prompt)) return [3 /*break*/, 3];
                    return [4 /*yield*/, prompt.call(this)];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    if (isFunction(prompt)) {
                        return [2 /*return*/, prompt.call(this)];
                    }
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    throw new Error("Error resolving prompt! " + err_1);
                case 6: return [2 /*return*/];
            }
        });
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
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!frame.pre) return [3 /*break*/, 2];
                    return [4 /*yield*/, frame.pre()];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [2 /*return*/, new RedirectResponse(false)];
            }
        });
    });
}
var RedirectResponse = (function () {
    function RedirectResponse(redirected, redirectFrameName) {
        this.frameRedirect = redirected;
        if (redirectFrameName) {
            this.result = {
                name: redirectFrameName
            };
        }
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
