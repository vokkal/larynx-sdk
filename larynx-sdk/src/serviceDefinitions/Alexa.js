/**
 * Alexa Skills Kit TypeScript definitions built from
 * [Alexa Skills Kit Interface Reference](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/alexa-skills-kit-interface-reference).
 *
 * Date: 2016/04/01
 */
"use strict";
exports.RequestType = {
    LaunchRequest: "LaunchRequest",
    IntentRequest: "IntentRequest",
    SessionEndedRequest: "SessionEndedRequest"
};
exports.SessionEndedReason = {
    USER_INITIATED: "USER_INITIATED",
    ERROR: "ERROR",
    EXCEEDED_MAX_REPROMPTS: "EXCEEDED_MAX_REPROMPTS"
};
/** String literal with possible values. Used in place of an enum to allow string type. */
exports.OutputSpeechType = {
    PlainText: "PlainText",
    SSML: "SSML",
};
/** String literal with possible values. Used in place of an enum to allow string type. */
exports.CardType = {
    Simple: "Simple",
    Standard: "Standard",
    LinkAccount: "LinkAccount"
};
