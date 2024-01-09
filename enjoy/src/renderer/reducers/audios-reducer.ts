export const audiosReducer = (
  audios: AudioType[],
  action: {
    type: "create" | "update" | "destroy" | "set";
    record?: Partial<AudioType>;
    records?: Partial<AudioType>[];
  }
) => {
  switch (action.type) {
    case "create": {
      return [action.record, ...audios];
    }
    case "update": {
      return audios.map((audio) => {
        if (audio.id === action.record.id) {
          return Object.assign(audio, action.record);
        } else {
          return audio;
        }
      });
    }
    case "destroy": {
      return audios.filter((audio) => audio.id !== action.record.id);
    }
    case "set": {
      return action.records || [];
    }
    default: {
      throw Error(`Unknown action: ${action.type}`);
    }
  }
};
