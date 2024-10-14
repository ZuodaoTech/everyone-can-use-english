import * as sdk from "microsoft-cognitiveservices-speech-sdk";
import { useContext } from "react";
import { AppSettingsProviderContext } from "@renderer/context";
import camelcaseKeys from "camelcase-keys";

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

    const result = await assess(
      {
        blob,
        language,
        reference,
      },
      { token, region }
    );

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

  return {
    createAssessment,
    assess,
  };
};
