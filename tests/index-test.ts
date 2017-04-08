import {LarynxClasses} from "../src/platforms/implementations";
import {CommonClasses} from "../src/platforms/common/common";
import {AlexaClasses} from "../src/platforms/alexa/Alexa";
import {LarynxInterfaces} from "../src/definitions/interfaces";
import {AlexaService} from "../src/definitions/AlexaService";
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
    constructor(options: {ContextOptions: SessionContextOptions}) {
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
            prompts = {responseName: "action response", responseFrame: {name: "AFrameImpl"}};
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
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
                this.stuff2 = options.ContextOptions.stuff2;
            }

            stuff2 = "this is stuff";
        }

        class B extends MyContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response", responseFrame: {name: "AFrameImpl"}};
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
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
            }
        }

        class AFrameImpl extends MyContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response", responseFrame: {name: "AFrameImpl"}};
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
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
            }
        }

        class AFrameImpl extends MyContext implements IFrame {
            prompts = {responseName: "first value", responseFrame: {name: "aFrameImpl"}};
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
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
            }
        }

        class FrameContextOptions implements IMyContext {
            stuff = "overwritten val";
            attributes = {};
        }

        class AFrameImpl extends MyContext implements IFrame {
            prompts = {responseName: "the value", responseFrame: {name: "AFrameImpl"}};
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
            constructor(options: {ContextOptions: IMyContext}) {
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
                    newVal: this.stuff
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
                    newVal: this.stuff
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

            constructor(options: {ContextOptions: IMyContext}) {
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

        let requestAdapter = new AlexaRequestAdapter(AlexaLaunchRequest, {name: "AFrame"});

        let frameOptions: IMyContext = {
            stuff: "mocha",
            attributes: AlexaLaunchRequest.session.attributes
        };

        let eventContext = new MyContext({ContextOptions: frameOptions});

        l.HandleEvent(requestAdapter, eventContext).then((responseModel: TemplateResponseModel) => {
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

            constructor(options: {ContextOptions: IMyContext}) {
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

        let requestAdapter = new AlexaRequestAdapter(AlexaLaunchRequest, {name: "AFrame"});

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