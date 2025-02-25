import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import camelcaseKeys from "camelcase-keys";
import { map, forEach, sum, filter, cloneDeep } from "lodash";
import * as Diff from "diff";

const THIRTY_SECONDS = 30 * 1000;
export const usePronunciationAssessments = () => {
  const { webApi, EnjoyApp } = useContext(AppSettingsProviderContext);

  const createAssessment = async (params: {
    language: string;
    recording: RecordingType;
    reference?: string;
    targetId?: string;
    targetType?: string;
  }) => {
    let { recording, targetId, targetType } = params;
    if (targetId && targetType && !recording) {
      recording = await EnjoyApp.recordings.findOne({ targetId });
    }

    EnjoyApp.recordings.sync(recording.id);
    const url = await EnjoyApp.echogarden.transcode(recording.src);
    const blob = await (await fetch(url)).blob();
    targetId = recording.id;
    targetType = "Recording";

    const { language, reference = recording.referenceText } = params;

    const {
      id: tokenId,
      token,
      region,
    } = await webApi.generateSpeechToken({
      purpose: "pronunciation_assessment",
      targetId,
      targetType,
    });

    let result = null;

    if (recording.duration < THIRTY_SECONDS) {
      result = await assess(
        {
          blob,
          language,
          reference,
        },
        { token, region }
      );
    } else {
      result = await continousAssess(
        {
          blob,
          language,
          reference,
        },
        { token, region }
      );
    }

    console.log("assess result: ", result);
    const resultJson = camelcaseKeys(
      JSON.parse(JSON.stringify(result.detailResult)),
      {
        deep: true,
      }
    );
    resultJson.tokenId = tokenId;
    resultJson.duration = recording?.duration;

    return EnjoyApp.pronunciationAssessments.create({
      targetId: recording.id,
      targetType: "Recording",
      pronunciationScore: result.pronunciationScore,
      accuracyScore: result.accuracyScore,
      completenessScore: result.completenessScore,
      fluencyScore: result.fluencyScore,
      prosodyScore: result.prosodyScore,
      grammarScore: result.contentAssessmentResult?.grammarScore,
      vocabularyScore: result.contentAssessmentResult?.vocabularyScore,
      topicScore: result.contentAssessmentResult?.topicScore,
      result: resultJson,
      language: params.language || recording.language,
    });
  };

  const assess = async (
    params: {
      blob: Blob;
      language: string;
      reference?: string;
    },
    options: {
      token: string;
      region: string;
    }
  ): Promise<sdk.PronunciationAssessmentResult> => {
    const { blob, language, reference } = params;
    const { token, region } = options;
    const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      new File([blob], "audio.wav")
    );

    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
      reference,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    pronunciationAssessmentConfig.phonemeAlphabet = "IPA";

    // setting the recognition language
    config.speechRecognitionLanguage = language;

    // create the speech recognizer.
    const reco = new sdk.SpeechRecognizer(config, audioConfig);
    pronunciationAssessmentConfig.applyTo(reco);

    return new Promise((resolve, reject) => {
      reco.recognizeOnceAsync((result) => {
        reco.close();

        switch (result.reason) {
          case sdk.ResultReason.RecognizedSpeech:
            const pronunciationResult =
              sdk.PronunciationAssessmentResult.fromResult(result);
            console.debug(
              "Received pronunciation assessment result.",
              pronunciationResult.detailResult
            );
            resolve(pronunciationResult);
            break;
          case sdk.ResultReason.NoMatch:
            reject(new Error("No speech could be recognized."));
            break;
          case sdk.ResultReason.Canceled:
            const cancellationDetails =
              sdk.CancellationDetails.fromResult(result);
            console.debug(
              "CANCELED: Reason=" +
                cancellationDetails.reason +
                " ErrorDetails=" +
                cancellationDetails.errorDetails
            );
            reject(new Error(cancellationDetails.errorDetails));
            break;
          default:
            reject(result);
        }
      });
    });
  };

  const continousAssess = async (
    params: {
      blob: Blob;
      language: string;
      reference?: string;
    },
    options: {
      token: string;
      region: string;
    }
  ): Promise<sdk.PronunciationAssessmentResult> => {
    const { blob, language, reference } = params;
    const { token, region } = options;
    const config = sdk.SpeechConfig.fromAuthorizationToken(token, region);
    const audioConfig = sdk.AudioConfig.fromWavFileInput(
      new File([blob], "audio.wav")
    );

    const pronunciationAssessmentConfig = new sdk.PronunciationAssessmentConfig(
      reference,
      sdk.PronunciationAssessmentGradingSystem.HundredMark,
      sdk.PronunciationAssessmentGranularity.Phoneme,
      true
    );
    pronunciationAssessmentConfig.phonemeAlphabet = "IPA";

    // setting the recognition language
    config.speechRecognitionLanguage = language;

    // create the speech recognizer.
    const reco = new sdk.SpeechRecognizer(config, audioConfig);
    pronunciationAssessmentConfig.applyTo(reco);

    return new Promise((resolve, reject) => {
      const pronunciationResults: sdk.PronunciationAssessmentResult[] = [];

      // The event recognizing signals that an intermediate recognition result is received.
      // You will receive one or more recognizing events as a speech phrase is recognized, with each containing
      // more recognized speech. The event will contain the text for the recognition since the last phrase was recognized.
      reco.recognizing = function (s, e) {
        const str =
          "(recognizing) Reason: " +
          sdk.ResultReason[e.result.reason] +
          " Text: " +
          e.result.text;
        console.log(str);
      };

      // The event recognized signals that a final recognition result is received.
      // This is the final event that a phrase has been recognized.
      // For continuous recognition, you will get one recognized event for each phrase recognized.
      reco.recognized = function (s, e) {
        console.log("pronunciation assessment for: ", e.result.text);
        const pronunciation_result =
          sdk.PronunciationAssessmentResult.fromResult(e.result);
        pronunciationResults.push(pronunciation_result);
        console.log("pronunciation result: ", pronunciation_result);
      };

      // The event signals that the service has stopped processing speech.
      // https://docs.microsoft.com/javascript/api/microsoft-cognitiveservices-speech-sdk/speechrecognitioncanceledeventargs?view=azure-node-latest
      // This can happen for two broad classes of reasons.
      // 1. An error is encountered.
      //    In this case the .errorDetails property will contain a textual representation of the error.
      // 2. Speech was detected to have ended.
      //    This can be caused by the end of the specified file being reached, or ~20 seconds of silence from a microphone input.
      reco.canceled = function (s, e) {
        if (e.reason === sdk.CancellationReason.Error) {
          const str =
            "(cancel) Reason: " +
            sdk.CancellationReason[e.reason] +
            ": " +
            e.errorDetails;
          console.error(str);
          reject(new Error(e.errorDetails));
        }
        reco.stopContinuousRecognitionAsync();
      };

      // Signals that a new session has started with the speech service
      reco.sessionStarted = function (s, e) {};

      // Signals the end of a session with the speech service.
      reco.sessionStopped = function (s, e) {
        reco.stopContinuousRecognitionAsync();
        reco.close();
        const mergedDetailResult = mergePronunciationResults();
        console.log("Merged detail result:", mergedDetailResult);
        const result = {
          pronunciationScore:
            mergedDetailResult.PronunciationAssessment.PronScore,
          accuracyScore:
            mergedDetailResult.PronunciationAssessment.AccuracyScore,
          completenessScore:
            mergedDetailResult.PronunciationAssessment.CompletenessScore,
          fluencyScore: mergedDetailResult.PronunciationAssessment.FluencyScore,
          prosodyScore: mergedDetailResult.PronunciationAssessment.ProsodyScore,
          detailResult: mergedDetailResult,
          contentAssessmentResult: mergedDetailResult.ContentAssessmentResult,
        };
        resolve(result as sdk.PronunciationAssessmentResult);
      };

      const mergePronunciationResults = () => {
        const detailResults = pronunciationResults.map((result) =>
          JSON.parse(JSON.stringify(result.detailResult))
        );

        const mergedDetailResult = detailResults.reduce(
          (acc, curr) => {
            acc.Confidence += curr.Confidence;
            acc.Display += " " + curr.Display;
            acc.ITN += " " + curr.ITN;
            acc.Lexical += " " + curr.Lexical;
            acc.MaskedITN += " " + curr.MaskedITN;
            acc.Words.push(...curr.Words);
            acc.PronunciationAssessment.AccuracyScore +=
              curr.PronunciationAssessment.AccuracyScore;
            acc.PronunciationAssessment.CompletenessScore +=
              curr.PronunciationAssessment.CompletenessScore;
            acc.PronunciationAssessment.FluencyScore +=
              curr.PronunciationAssessment.FluencyScore;
            acc.PronunciationAssessment.ProsodyScore +=
              curr.PronunciationAssessment?.ProsodyScore ?? 0;
            acc.PronunciationAssessment.PronScore +=
              curr.PronunciationAssessment?.PronScore ?? 0;

            acc.ContentAssessmentResult.GrammarScore +=
              curr.ContentAssessmentResult?.GrammarScore ?? 0;
            acc.ContentAssessmentResult.VocabularyScore +=
              curr.ContentAssessmentResult?.VocabularyScore ?? 0;
            acc.ContentAssessmentResult.TopicScore +=
              curr.ContentAssessmentResult?.TopicScore ?? 0;

            return acc;
          },
          {
            Confidence: 0,
            Display: "",
            ITN: "",
            Lexical: "",
            MaskedITN: "",
            Words: [],
            PronunciationAssessment: {
              AccuracyScore: 0,
              CompletenessScore: 0,
              FluencyScore: 0,
              ProsodyScore: 0,
              PronScore: 0,
            },
            ContentAssessmentResult: {
              GrammarScore: 0,
              VocabularyScore: 0,
              TopicScore: 0,
            },
          }
        );

        mergedDetailResult.PronunciationAssessment.AccuracyScore = (
          mergedDetailResult.PronunciationAssessment.AccuracyScore /
          pronunciationResults.length
        ).toFixed(2);
        mergedDetailResult.PronunciationAssessment.CompletenessScore = (
          mergedDetailResult.PronunciationAssessment.CompletenessScore /
          pronunciationResults.length
        ).toFixed(2);
        mergedDetailResult.PronunciationAssessment.FluencyScore = (
          mergedDetailResult.PronunciationAssessment.FluencyScore /
          pronunciationResults.length
        ).toFixed(2);
        mergedDetailResult.PronunciationAssessment.ProsodyScore = (
          mergedDetailResult.PronunciationAssessment.ProsodyScore /
          pronunciationResults.length
        ).toFixed(2);
        mergedDetailResult.PronunciationAssessment.PronScore = (
          mergedDetailResult.PronunciationAssessment.PronScore /
          pronunciationResults.length
        ).toFixed(2);

        mergedDetailResult.Confidence =
          mergedDetailResult.Confidence / pronunciationResults.length;

        mergedDetailResult.ContentAssessmentResult.GrammarScore = (
          mergedDetailResult.ContentAssessmentResult.GrammarScore /
          pronunciationResults.length
        ).toFixed(2);
        mergedDetailResult.ContentAssessmentResult.VocabularyScore = (
          mergedDetailResult.ContentAssessmentResult.VocabularyScore /
          pronunciationResults.length
        ).toFixed(2);
        mergedDetailResult.ContentAssessmentResult.TopicScore = (
          mergedDetailResult.ContentAssessmentResult.TopicScore /
          pronunciationResults.length
        ).toFixed(2);

        return mergedDetailResult;
      };

      reco.startContinuousRecognitionAsync();
    });
  };

  return {
    createAssessment,
    assess,
    continousAssess,
  };
};
