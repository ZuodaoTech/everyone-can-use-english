type PronunciationAssessmentType = {
  id: string;
  language?: string;
  targetId: string;
  targetType: string;
  referenceText: string;
  accuracyScore: number;
  completenessScore: number;
  fluencyScore: number;
  pronunciationScore: number;
  prosodyScore?: number;
  grammarScore?: number;
  vocabularyScore?: number;
  topicScore?: number;
  result: {
    confidence: number;
    display: string;
    itn: string;
    lexical: string;
    markedItn: string;
    pronunciationAssessment: {
      accuracyScore: number;
      completenessScore: number;
      fluencyScore: number;
      pronScore: number;
    };
    words: PronunciationAssessmentWordResultType[];
  };
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  isSynced: boolean;
  recording?: RecodingType;
  target?: RecodingType;
};

type PronunciationAssessmentWordResultType = {
  duration: number;
  offset: number;
  word: string;
  pronunciationAssessment: {
    accuracyScore: number;
    errorType?:
      | "None"
      | "Omission"
      | "Insertion"
      | "Mispronunciation"
      | "UnexpectedBreak"
      | "MissingBreak"
      | "Monotone";
  };
  phonemes: {
    duration: number;
    offset: number;
    phoneme: string;
    pronunciationAssessment: {
      accuracyScore: number;
    };
  }[];
  syllables: {
    duration: number;
    offset: number;
    syllable: string;
    pronunciationAssessment: {
      accuracyScore: number;
    };
  };
};

type SpeechRecognitionResultType = {
  Id: string;
  RecognitionStatus: string;
  Offset: number;
  Duration: number;
  Channel: number;
  DisplayText: string;
  NBest: {
    Confidence: number;
    Lexical: string;
    ITN: string;
    MaskedITN: string;
    Display: string;
    Words: {
      Word: string;
      Offset: number;
      Duration: number;
    }[];
  }[];
};
