import * as LarynxClasses from "../src/implementations";
import * as sdk from "../src/index";
import ActionResponseModel = LarynxInterfaces.ActionResponseModel;
import EventContainer = LarynxClasses.EventContainer;
import IFrame = LarynxInterfaces.IFrame;
import ISessionContext = LarynxInterfaces.ISessionContext;
import {expect} from "chai";
import Frames = LarynxInterfaces.Frames;

class SessionContextOptions {
    stuff: string;
    attributes: any;
}

class AlexaEventContext implements ISessionContext {
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

        class AFrameImpl extends AlexaEventContext implements IFrame {
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
        interface IMyContext extends AlexaEventContext {
            stuff2: string;
        }

        class FrameContextOptions implements IMyContext {
            stuff = "original context obj";
            stuff2 = "overwritten val 2";
            attributes = {};
        }

        class MyContext extends AlexaEventContext {
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
        interface IMyContext extends AlexaEventContext {
        }

        class MyContext extends AlexaEventContext {
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
        interface IMyContext extends AlexaEventContext {
        }

        class MyContext extends AlexaEventContext {
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

        let l = sdk.initialize({});

        let frameImpl = new EventContainer({name: "aFrameImpl"}, AFrameImpl, []);

        l.Register(frameImpl);

        expect(l.Frames["aFrameImpl"].length).equal(1);
    });

    it("can register a duplicate frame name", () => {
        interface IMyContext extends AlexaEventContext {
        }

        class MyContext extends AlexaEventContext {
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
            }
        }

        class AFrameImpl extends MyContext implements IFrame {
            prompts = {responseName: "second value", responseFrame: {name: "AFrameImpl"}};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let l = sdk.initialize({});

        let frameImpl = new EventContainer({name: "aFrameImpl"}, AFrameImpl, []);

        l.Register(frameImpl);

        expect(l.Frames["aFrameImpl"][1]).any;

    });

    it("can register duplicate frames with different values", () => {
        interface IMyContext extends AlexaEventContext {
        }

        class MyContext extends AlexaEventContext {
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
            }
        }

        class FrameContextOptions implements ISessionContext {
            stuff = "overwritten val";
        }

        let AFrameImpl = class extends MyContext implements IFrame {
            prompts = {responseName: "third value", responseFrame: {name: "AFrameImpl"}};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
            frameTargets: Array<Frames>;
        };

        let l = sdk.initialize({});

        let a0 = l.Frames["aFrameImpl"][0];
        let a1 = l.Frames["aFrameImpl"][1];

        let A0 = new a0.impl({ContextOptions: new FrameContextOptions()});
        let A1 = new a1.impl({ContextOptions: new FrameContextOptions()});

        expect(a0.frameId.name).eq("aFrameImpl");
        expect(a1.frameId.name).eq("aFrameImpl");

        expect((A0.prompts as ActionResponseModel).responseName).eq("first value");
        expect((A1.prompts as ActionResponseModel).responseName).eq("second value");
    });
});
