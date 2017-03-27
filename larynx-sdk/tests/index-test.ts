import {expect} from "chai";
import {PartialContext} from "../src/mixinClasses";
import interfaces = require("../src/interfaces");
import IFrame = interfaces.IFrame;
import ISessionContext = interfaces.ISessionContext;
import * as sdk from "../src/index";
import ActionResponseModel = interfaces.ActionResponseModel;

describe("obj", () => {
    it("can use context", () => {
        class FrameContextOptions implements ISessionContext {
            stuff = "overwritten val";
        }

        class AFrameImpl extends PartialContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response"};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let b = new AFrameImpl({ContextOptions: new FrameContextOptions()});

        expect(b.stuff).eq("overwritten val");
    });

    it("can use custom context", () => {
        interface IMyContext extends ISessionContext {
            stuff2: string;
        }

        class FrameContextOptions implements IMyContext {
            stuff = "original context obj";
            stuff2 = "overwritten val 2";
        }

        class MyContext extends PartialContext {
            constructor(options: {ContextOptions: IMyContext}) {
                super(options);
                this.stuff2 = options.ContextOptions.stuff2;
            }

            stuff2 = "this is stuff";
        }

        class B extends MyContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response"};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let b = new B({ContextOptions: new FrameContextOptions()});

        expect(b.stuff).eq("original context obj");
        expect(b.stuff2).eq("overwritten val 2");
    });

    it("can check a frame identifier using a getter", () => {
        class AFrameImpl extends PartialContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "action response"};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        class FrameContextOptions implements ISessionContext {
            stuff = "overwritten val";
        }

        let aFrameImpl = new AFrameImpl({ContextOptions: new FrameContextOptions()});

        expect(aFrameImpl.frameName).eq("AFrameImpl");
    });

    it("can register a new frame", () => {
        class AFrameImpl extends PartialContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "first value"};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let l = sdk.initialize({});

        sdk.registerFrame("aFrameImpl", AFrameImpl);

        expect(l.Frames["aFrameImpl"][0]).any;

    });

    it("can register a duplicate frame name", () => {
        class AFrameImpl extends PartialContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "second value"};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        }

        let l = sdk.initialize({});

        sdk.registerFrame("aFrameImpl", AFrameImpl);

        expect(l.Frames["aFrameImpl"][1]).any;

    });

    it("can register duplicate frames with different values", () => {
        class FrameContextOptions implements ISessionContext {
            stuff = "overwritten val";
        }

        let AFrameImpl = class extends PartialContext implements IFrame {
            frameName = "AFrameImpl";
            prompts = {responseName: "third value"};
            sessionEnded = function () {
                return new Promise(resolve => {
                    resolve();
                });
            };
        };

        let l = sdk.initialize({});

        let a0 = l.Frames["aFrameImpl"][0];
        let a1 = l.Frames["aFrameImpl"][1];

        let A0 = new a0({ContextOptions: new FrameContextOptions()});
        let A1 = new a1({ContextOptions: new FrameContextOptions()});

        expect(A0.frameName).eq("AFrameImpl");
        expect(A1.frameName).eq("AFrameImpl");

        expect((A0.prompts as ActionResponseModel).responseName).eq("first value");
        expect((A1.prompts as ActionResponseModel).responseName).eq("second value");
    });
});
