import {AlexaClasses, AlexaService, CommonClasses, LarynxClasses, LarynxInterfaces} from "../src/index";
import {expect} from "chai";

import ISessionContext = LarynxInterfaces.ISessionContext;
import IFrame = LarynxInterfaces.IFrame;
import Frames = LarynxInterfaces.Frames;
import EventContainer = LarynxClasses.EventContainer;
import ActionResponseModel = LarynxInterfaces.ActionResponseModel;
import RedirectResponse = CommonClasses.RedirectResponse;
import AlexaRequestAdapter = AlexaClasses.AlexaRequestAdapter;
import TemplateResponseModel = CommonClasses.TemplateResponseModel;
import AlexaRequestBody = AlexaService.AlexaRequestBody;
import {ActionHandlers, Actions, GenericAction, NamedAction} from "../src/definitions/interfaces";
import {IntentRequest} from "../src/definitions/AlexaService";

let sdk = require("../src/index");

class SessionContextOptions {
    stuff: string;
    attributes: any;
}

class LarynxEventOptions implements ISessionContext {
    stuff: string;
    attributes: any;

    // constructor can take a config object
    // the same object will be given to all mixins
    constructor(options: { ContextOptions: SessionContextOptions }) {
        this.stuff = options.ContextOptions.stuff;
        this.attributes = options.ContextOptions.attributes;
    }
}

describe("obj", () => {
    it("can use context", () => {
        class FrameContextOptions extends SessionContextOptions {
            stuff = "overwritten val";
            attributes = {};
        }

        class AFrameImpl extends LarynxEventOptions implements IFrame {
            prompts = {responseName: "action response", responseFrame: {name: "AFrameImpl"}, endsSession: true};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
            frameTargets: Array<Frames>;
        }

        let b = new AFrameImpl({ContextOptions: new FrameContextOptions()});

        expect(b.stuff).eq("overwritten val");
    });

    it("can use custom context", () => {
        interface IMyContext extends LarynxEventOptions {
            stuff2: string;
        }

        class FrameContextOptions implements IMyContext {
            stuff = "original context obj";
            stuff2 = "overwritten val 2";
            attributes = {};
        }

        class MyContext extends LarynxEventOptions {
            constructor(options: { ContextOptions: IMyContext }) {
                super(options);
                this.stuff2 = options.ContextOptions.stuff2;
            }

            stuff2 = "this is stuff";
        }

        class B extends MyContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response", responseFrame: {name: "AFrameImpl"}, endsSession: true};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
            frameTargets: Array<Frames>;
        }

        let b = new B({ContextOptions: new FrameContextOptions()});

        expect(b.stuff).eq("original context obj");
        expect(b.stuff2).eq("overwritten val 2");
    });

    it("can check a frame identifier using a getter", () => {
        interface IMyContext extends LarynxEventOptions {
        }

        class MyContext extends LarynxEventOptions {
            constructor(options: { ContextOptions: IMyContext }) {
                super(options);
            }
        }

        class AFrameImpl extends MyContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response", responseFrame: {name: "AFrameImpl"}, endsSession: true};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
            frameTargets: Array<Frames>;
        }

        class FrameContextOptions implements ISessionContext {
            stuff = "overwritten val";
            attributes = {};
        }

        let aFrameImpl = new AFrameImpl({ContextOptions: new FrameContextOptions()});

        expect(aFrameImpl.frameName).eq("AFrameImpl");
    });

    it("can register a new frame", () => {
        interface IMyContext extends LarynxEventOptions {
        }

        class MyContext extends LarynxEventOptions {
            constructor(options: { ContextOptions: IMyContext }) {
                super(options);
            }
        }

        class AFrameImpl extends MyContext implements IFrame {
            prompts = {responseName: "first value", responseFrame: {name: "aFrameImpl"}, endsSession: true};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let l = sdk.initialize({reset: true});

        let frameImpl = new EventContainer({name: "aFrameImpl"}, AFrameImpl, []);

        l.Register(frameImpl);

        expect(l.Frames["aFrameImpl"].length).equal(1);
    });

    it("can register a duplicate frame name", () => {
        interface IMyContext extends LarynxEventOptions {
        }

        class MyContext extends LarynxEventOptions {
            constructor(options: { ContextOptions: IMyContext }) {
                super(options);
            }
        }

        class FrameContextOptions implements IMyContext {
            stuff = "overwritten val";
            attributes = {};
        }

        class AFrameImpl extends MyContext implements IFrame {
            prompts = {responseName: "the value", responseFrame: {name: "AFrameImpl"}, endsSession: true};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let l = sdk.initialize({reset: true});

        let frameImpl = new EventContainer({name: "aFrameImpl"}, AFrameImpl, []);
        let frameImpl2 = new EventContainer({name: "aFrameImpl"}, AFrameImpl, []);

        l.Register(frameImpl);
        l.Register(frameImpl2);

        expect(l.Frames["aFrameImpl"][1]);

        let a = l.Frames["aFrameImpl"][0];

        let A = new a.impl({ContextOptions: new FrameContextOptions()});

        expect(a.frameId.name).eq("aFrameImpl");
        expect((A.prompts as ActionResponseModel).responseName).eq("the value");

    });

    it("can register duplicate frames with different values", () => {
        interface IMyContext extends LarynxEventOptions {
        }

        class MyContext extends LarynxEventOptions {
            constructor(options: { ContextOptions: IMyContext }) {
                super(options);
            }
        }

        class FrameContextOptions implements IMyContext {
            stuff = "overwritten val";
            attributes = {};
        }

        let AFrameImpl = class extends MyContext implements IFrame {
            prompts = function () {
                return {
                    responseName: "first value",
                    responseFrame: {name: "AFrameImpl"},
                    newVal: this.stuff,
                    endsSession: true
                };
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let BFrameImpl = class extends MyContext implements IFrame {
            prompts = function () {
                return {
                    responseName: "second value",
                    responseFrame: {name: "AFrameImpl"},
                    newVal: this.stuff,
                    endsSession: true
                };
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let l = sdk.initialize({reset: true});

        let frameImpl = new EventContainer({name: "aFrameImpl"}, AFrameImpl, []);
        let frameImpl2 = new EventContainer({name: "aFrameImpl"}, BFrameImpl, []);

        l.Register(frameImpl);
        l.Register(frameImpl2);

        let a0 = l.Frames["aFrameImpl"][0];
        let a1 = l.Frames["aFrameImpl"][1];

        let A0 = new a0.impl({ContextOptions: new FrameContextOptions()});
        let A1 = new a1.impl({ContextOptions: new FrameContextOptions()});

        expect(a0.frameId.name).eq("aFrameImpl");
        expect(a1.frameId.name).eq("aFrameImpl");

        class ExtendedResponse implements ActionResponseModel {
            responseName: string;
            responseFrame: Frames;
            newVal: string;
            endsSession: boolean;
        }

        expect((A0.prompts as () => ExtendedResponse)().responseName).eq("first value");
        expect((A1.prompts as () => ExtendedResponse)().responseName).eq("second value");
        expect((A1.prompts as () => ExtendedResponse)().newVal).eq("overwritten val");
    });

    it("can redirect from one frame to another", (done) => {
        interface IMyContext extends LarynxEventOptions {
        }

        class MyContext implements IMyContext {
            stuff: string;
            attributes: any;

            constructor(options: { ContextOptions: IMyContext }) {
                this.stuff = options.ContextOptions.stuff;
                this.attributes = options.ContextOptions.attributes;
            }
        }

        let AFrameImpl = class extends MyContext implements IFrame {
            pre = function () {
                return new Promise(resolve => {
                    resolve(new RedirectResponse(true, "BFrame"));
                });
            };
            prompts = function () {
                return new TemplateResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let BFrameImpl = class extends MyContext implements IFrame {
            pre = function () {
                return new Promise(resolve => {
                    resolve(new RedirectResponse(false));
                });
            };
            prompts = function () {
                return new TemplateResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let l = sdk.initialize({reset: true});

        let AFrameContainer = new EventContainer({name: "AFrame"}, AFrameImpl, [{name: "BFrame"}]);
        let BFrameContainer = new EventContainer({name: "BFrame"}, BFrameImpl, []);

        l.Register(AFrameContainer);
        l.Register(BFrameContainer);

        let requestAdapter = new AlexaRequestAdapter(AlexaLaunchRequest, {name: "AFrame"}, l.Actions);

        let frameOptions: IMyContext = {
            stuff: "mocha",
            attributes: AlexaLaunchRequest.session.attributes
        };

        let eventContext = new MyContext({ContextOptions: frameOptions});

        l.HandleEvent(requestAdapter, eventContext).then(
            (responseModel: TemplateResponseModel) => {
                expect(responseModel.responseFrame.name).eq("BFrame");
                expect(responseModel.responseFrameIndex).eq(0);
                expect(responseModel.ssml).eq("<speak>Hello, mocha!</speak>");
                done();
            }, (error: Error) => {
                console.log(error + error.message);
                done(error);
            }).catch((error: Error) => {
            console.log(error + error.message);
            done(error);
        });
    });

    it("can catch redirect loops", (done) => {
        interface IMyContext extends LarynxEventOptions {
        }

        class MyContext implements IMyContext {
            stuff: string;
            attributes: any;

            constructor(options: { ContextOptions: IMyContext }) {
                this.stuff = options.ContextOptions.stuff;
                this.attributes = options.ContextOptions.attributes;
            }
        }

        let AFrameImpl = class extends MyContext implements IFrame {
            pre = function () {
                return new Promise(resolve => {
                    resolve(new RedirectResponse(true, "BFrame"));
                });
            };
            prompts = function () {
                return new TemplateResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let BFrameImpl = class extends MyContext implements IFrame {
            pre = function () {
                return new Promise(resolve => {
                    resolve(new RedirectResponse(true, "AFrame"));
                });
            };
            prompts = function () {
                return new TemplateResponseModel("hello world", "<speak>Hello, " + this.stuff + "!</speak>");
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let l = sdk.initialize({reset: true});

        let AFrameContainer = new EventContainer({name: "AFrame"}, AFrameImpl, [{name: "BFrame"}]);
        let BFrameContainer = new EventContainer({name: "BFrame"}, BFrameImpl, [{name: "AFrame"}]);

        l.Register(AFrameContainer);
        l.Register(BFrameContainer);

        let requestAdapter = new AlexaRequestAdapter(AlexaLaunchRequest, {name: "AFrame"}, l.Actions);

        let frameOptions: IMyContext = {
            stuff: "mocha",
            attributes: AlexaLaunchRequest.session.attributes
        };

        let eventContext = new MyContext({ContextOptions: frameOptions});

        l.HandleEvent(requestAdapter, eventContext).then(
            () => {
                throw new Error("This shouldn't happen!");
            },
            (error: Error) => {
                expect(error.message).equal("Too many redirects!\nAFrame => BFrame => AFrame => BFrame => AFrame => BFrame => AFrame => BFrame => AFrame => BFrame => AFrame");
                done();
            }).catch((error: Error) => {
            done(error);
        });
    });

    it("can handle events", (done) => {
        interface IMyContext {
            attributes: any;
            myVal: string;
        }

        class MyContext implements IMyContext {
            myVal: string;
            attributes: any;

            constructor(options: { ContextOptions: IMyContext }) {
                this.myVal = options.ContextOptions.myVal;
                this.attributes = options.ContextOptions.attributes;
            }
        }

        let unhandledFrame: Frames = {
            name: "unhandled"
        };

        let answeredYesFrame: Frames = {
            name: "answeredYes"
        };

        let answeredNoFrame: Frames = {
            name: "answeredNo"
        };

        let unhandledAction: GenericAction = {
            handler: unhandledFrame
        };

        let yesAction: Actions = {
            name: "YesAction"
        };

        let noAction: Actions = {
            name: "NoAction"
        };

        let yesHandler: NamedAction = {
            action: yesAction,
            handler: answeredYesFrame
        };

        let noHandler: NamedAction = {
            action: noAction,
            handler: function () {
                return answeredNoFrame; // TODO: fix issue with using promise here
            }
        };

        let actionHandlers: ActionHandlers = {
            actions: [yesHandler, noHandler],
            unhandled: unhandledAction
        };

        class StartNode extends MyContext implements IFrame {
            pre = function () {
                return new Promise(resolve => {
                    this.myVal = "overwritten";
                    resolve(new RedirectResponse(false));
                });
            };
            prompts = function () {
                return new TemplateResponseModel("hello", "<speak>say yes or no</speak>");
            };
            transitions = actionHandlers;
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        class SaidNo extends MyContext implements IFrame {
            prompts = function () {
                return new TemplateResponseModel("hello", "<speak>user said no</speak>");
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        class SaidYes extends MyContext implements IFrame {
            prompts = function () {
                return new TemplateResponseModel("hello", "<speak>user said Yes</speak>");
            };
            transitions = actionHandlers;
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        class SaidUnhandled extends MyContext implements IFrame {
            prompts = function () {
                return new TemplateResponseModel("hello", "<speak>user input unhandled</speak>");
            };
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let l = sdk.initialize({reset: true});

        let startContainer = new EventContainer({name: "startNode"}, StartNode, [{name: "answeredYes"}, {name: "answeredNo"}, {name: "unhandled"}]);
        let saidYesContainer = new EventContainer({name: "answeredYes"}, SaidYes, []);
        let saidNoContainer = new EventContainer({name: "answeredNo"}, SaidNo, []);
        let unhandledContainer = new EventContainer({name: "unhandled"}, SaidUnhandled, []);

        l.Register(startContainer);
        l.Register(saidYesContainer);
        l.Register(saidNoContainer);
        l.Register(unhandledContainer);

        l.Actions["AMAZON.YesIntent"] = yesAction;
        l.Actions["AMAZON.NoIntent"] = noAction;

        let myRequest = JSON.parse(JSON.stringify(AlexaLaunchRequest)) as AlexaRequestBody;

        let yesIntent: IntentRequest = {
            type: "IntentRequest",
            intent: {
                name: "AMAZON.YesIntent",
                slots: []
            },
            requestId: "aRequest",
            timestamp: new Date().getTime().toString(),
            locale: "EN_US"
        };

        let unhandledIntent: IntentRequest = {
            type: "IntentRequest",
            intent: {
                name: "Unknown!!",
                slots: []
            },
            requestId: "aRequest",
            timestamp: new Date().getTime().toString(),
            locale: "EN_US"
        };

        let LaunchRequestAdapter = new AlexaRequestAdapter(AlexaLaunchRequest, {name: "startNode"}, l.Actions);

        let frameOptions: IMyContext = {
            myVal: "mocha",
            attributes: AlexaLaunchRequest.session.attributes
        };

        let eventContext = new MyContext({ContextOptions: frameOptions});

        interface MyResponseModel extends TemplateResponseModel, MyContext {}

        l.HandleEvent(LaunchRequestAdapter, eventContext).then(
            (responseModel: MyResponseModel) => {
                expect(responseModel.responseFrame.name).eq("startNode");
                expect(responseModel.responseFrameIndex).eq(0);
                expect(responseModel.ssml).eq("<speak>say yes or no</speak>");
                expect(responseModel.myVal).eq("overwritten");
                myRequest.session.attributes["currentFrame"] = responseModel.responseFrame;
                myRequest.session.attributes["currentFrameIndex"] = responseModel.responseFrameIndex;
                myRequest.session.attributes["waitingForTransition"] = true;
                myRequest.request = yesIntent;

                frameOptions.attributes = myRequest.session.attributes;

                eventContext = new MyContext({ContextOptions: frameOptions});

                let YesRequestAdapter = new AlexaRequestAdapter(myRequest, {name: "startNode"}, l.Actions);
                l.HandleEvent(YesRequestAdapter, eventContext).then(
                    (responseModel: TemplateResponseModel) => {
                        expect(responseModel.responseFrame.name).eq("answeredYes");
                        expect(responseModel.responseFrameIndex).eq(0);
                        expect(responseModel.ssml).eq("<speak>user said Yes</speak>");

                        myRequest.session.attributes["currentFrame"] = responseModel.responseFrame;
                        myRequest.session.attributes["currentFrameIndex"] = responseModel.responseFrameIndex;
                        myRequest.session.attributes["waitingForTransition"] = true;
                        myRequest.request = unhandledIntent;

                        frameOptions.attributes = myRequest.session.attributes;

                        eventContext = new MyContext({ContextOptions: frameOptions});

                        let unhandledRequestAdapter = new AlexaRequestAdapter(myRequest, {name: "startNode"}, l.Actions);

                        l.HandleEvent(unhandledRequestAdapter, eventContext).then(
                            (responseModel: TemplateResponseModel) => {
                                expect(responseModel.responseFrame.name).eq("unhandled");
                                expect(responseModel.responseFrameIndex).eq(0);
                                expect(responseModel.ssml).eq("<speak>user input unhandled</speak>");
                                done();
                            }).catch(
                            (error: Error) => {
                                done(error);
                            });
                    },
                    (error: Error) => {
                        done(error);
                    });
            },
            (error: Error) => {
                done(error);
            }).catch(
            (error: Error) => {
                done(error);
            });
    });
});

let AlexaLaunchRequest: AlexaRequestBody = {
    version: "1.0",
    session: {
        "new": false,
        sessionId: "LarynxMochaTestSessionId",
        attributes: {},
        application: {
            applicationId: "LarynxMochaTestAppId"
        },
        user: {
            userId: "LarynxMochaTestUserId"
        }
    },
    context: {
        System: {
            application: {
                applicationId: "LarynxMochaTestAppId"
            },
            user: {
                userId: "LarynxMochaTestUserId",
                permissions: {
                    consentToken: "LarynxMochaTestConsentToken"
                },
                accessToken: "LarynxMochaTestAccessToken"
            },
            device: {
                deviceId: "LarynxMochaTestDeviceId",
                supportedInterfaces: {
                    AudioPlayer: {}
                }
            }
        },
        AudioPlayer: {
            token: "LarynxMochaTestAudioPlayerToken",
            offsetInMilliseconds: 0,
            playerActivity: ""
        },
    },
    request: {
        type: "LaunchRequest",
        requestId: "LarynxMochaTestRequestId",
        timestamp: "" + new Date().getTime(),
        locale: "EN_US",
    }
};