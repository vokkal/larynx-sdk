namespace LarynxClasses {
    import IEventContainer = LarynxInterfaces.IEventContainer;
    import Frames = LarynxInterfaces.Frames;
    import CreatesFrame = LarynxInterfaces.CreatesFrame;

    export class EventContainer implements IEventContainer {
        constructor(frameId: Frames, impl: CreatesFrame, targets: Array<Frames>) {
            this.frameId = frameId;
            this.impl = impl;
            this.targets = targets;
        }

        frameId: Frames;
        impl: CreatesFrame;
        targets: Array<Frames>;

    }
}