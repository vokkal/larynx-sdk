/** String literal with possible values. Used in place of an enum to allow string type. */
namespace Alexa {
    export type AlexaRequestType = "LaunchRequest" | "IntentRequest" | "SessionEndedRequest";

    export const RequestType = {
        LaunchRequest: "LaunchRequest" as AlexaRequestType,
        IntentRequest: "IntentRequest" as AlexaRequestType,
        SessionEndedRequest: "SessionEndedRequest" as AlexaRequestType
    };

    /** String literal with possible values. Used in place of an enum to allow string type.
     * USER_INITIATED: The user explicitly ended the session.
     * ERROR: An error occurred that caused the session to end.
     * EXCEEDED_MAX_REPROMPTS: The user either did not respond or responded with an utterance that did not match any of the intents defined in your voice interface.
     */
    export type SessionEndedReason = "USER_INITIATED" | "ERROR" | "EXCEEDED_MAX_REPROMPTS";
    export const SessionEndedReason = {
        USER_INITIATED: "USER_INITIATED" as SessionEndedReason,
        ERROR: "ERROR" as SessionEndedReason,
        EXCEEDED_MAX_REPROMPTS: "EXCEEDED_MAX_REPROMPTS" as SessionEndedReason
    };

    /** String literal with possible values. Used in place of an enum to allow string type. */
    export type OutputSpeechType = "PlainText" | "SSML";
    export const OutputSpeechType = {
        PlainText: "PlainText" as OutputSpeechType,
        SSML: "SSML" as OutputSpeechType,
    };

    /** String literal with possible values. Used in place of an enum to allow string type. */
    export type CardType = "Simple" | "Standard" | "LinkAccount";
    export const CardType = {
        Simple: "Simple" as CardType,
        Standard: "Standard" as CardType,
        LinkAccount: "LinkAccount" as CardType
    };
}