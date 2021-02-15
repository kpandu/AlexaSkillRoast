const Alexa = require("ask-sdk-core");
const { default: axios } = require("axios");

const SKILL_NAME = "Roast";
const GET_ROAST_MESSAGE = " ";

const CONTINUE_REPROMPT = " You need more pain after that one? ";
const REPEAT_MESSAGE = " Bet, here it is. ";

const CANT_REPEAT_PROMPT =
  " There is nothing to repeat. Do you want to hear another roast? ";
const CANT_REPEAT_REPROMPT = " Do you want to hear a new roast? ";

const HELP_REPROMPT = " Do you want to hear a roast? ";
const HELP_MESSAGE =
  " Welcome to roast. You can say, ask roast for a roast or you can say, give me a roast from roast! ";

const FALLBACK_REPROMPT = " Do you want to hear a roast? ";
const FALLBACK_MESSAGE =
  " The roast skill can't help with that. Please try saying, tell me a roast. ";

const STOP_MESSAGE = " Thank you for using roast! Bring tissues next time. ";
const ERROR_MESSAGE =
  " Sorry, an error occurred. Please try again after some time. ";

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      (request.intent.name === "AMAZON.CancelIntent" ||
        request.intent.name === "AMAZON.StopIntent" ||
        request.intent.name === "AMAZON.NoIntent")
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.speak(STOP_MESSAGE).getResponse();
  },
};

const HelpHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.HelpIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(HELP_MESSAGE + HELP_REPROMPT)
      .reprompt(HELP_REPROMPT)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return request.type === "SessionEndedRequest";
  },
  handle(handlerInput) {
    console.log(
      `Session ended by ${handlerInput.requestEnvelope.request.reason}`
    );
    return handlerInput.responseBuilder.getResponse();
  },
};

const FallbackHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.FallbackIntent"
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(FALLBACK_MESSAGE + FALLBACK_REPROMPT)
      .reprompt(FALLBACK_REPROMPT)
      .getResponse();
  },
};

const GetNewRoastHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "LaunchRequest" ||
      (request.type === "IntentRequest" &&
        request.intent.name === "GetNewRoastIntent") ||
      request.intent.name === "AnotherRoastIntent" ||
      request.intent.name === "AMAZON.YesIntent"
    );
  },
  async handle(handlerInput) {
    const randomRoast = await getRoast();
    const speechOutput = GET_ROAST_MESSAGE + randomRoast + CONTINUE_REPROMPT;
    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    sessionAttributes.lastSpeech = randomRoast;
    attributesManager.setSessionAttributes(sessionAttributes);
    return handlerInput.responseBuilder
      .speak(speechOutput)
      .reprompt(HELP_REPROMPT)
      .withSimpleCard(SKILL_NAME, randomRoast)
      .getResponse();
  },
};

const getRoast = async () => {
  let response = await axios.get(
    "https://evilinsult.com/generate_insult.php?lang=en&type=json"
  );
  console.log(response.data);
  if (!response.data) {
    return " ";
  } else {
    return response.data.insult || "" + " ";
  }
};
const RepeatHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    return (
      request.type === "IntentRequest" &&
      request.intent.name === "AMAZON.RepeatIntent"
    );
  },
  handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    let sessionAttributes = attributesManager.getSessionAttributes();
    let roast = sessionAttributes.lastSpeech;
    if (roast) {
      return handlerInput.responseBuilder
        .speak(REPEAT_MESSAGE + roast + CONTINUE_REPROMPT)
        .reprompt(CONTINUE_REPROMPT)
        .getResponse();
    } else {
      return handlerInput.responseBuilder
        .speak(CANT_REPEAT_PROMPT)
        .reprompt(CANT_REPEAT_PROMPT)
        .getResponse();
    }
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);

    return handlerInput.responseBuilder.speak(ERROR_MESSAGE).getResponse();
  },
};

let skill;

exports.handler = async (event, context) => {
  console.log("REQUEST", JSON.stringify(event));
  if (!skill) {
    skill = Alexa.SkillBuilders.custom()
      .addRequestHandlers(
        GetNewRoastHandler,
        RepeatHandler,
        HelpHandler,
        FallbackHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler
      )
      .addErrorHandlers(ErrorHandler)
      .create();
  }

  const response = await skill.invoke(event, context);
  console.log("RESPONSE", JSON.stringify(response));
  return response;
};
