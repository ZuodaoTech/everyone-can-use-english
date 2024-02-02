export const audiosReducer = (
  audios: AudioType[],
  action: {
    type: "append" | "create" | "update" | "destroy" | "set";
    record?: Partial<AudioType>;
    records?: Partial<AudioType>[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...audios, action.record];
      } else if (action.records) {
        return [...audios, ...action.records];
      } else {
        return audios;
      }
    }
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
