export const recordingsReducer = (
  recordings: RecordingType[],
  action: {
    type: "append" | "create" | "update" | "destroy" | "set";
    record?: RecordingType;
    records?: RecordingType[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...recordings, action.record];
      } else if (action.records) {
        return [...recordings, ...action.records];
      } else {
        return recordings;
      }
    }
    case "create": {
      return [action.record, ...recordings];
    }
    case "update": {
      return recordings.map((r) => {
        if (r.id === action.record.id) {
          return action.record;
        } else {
          return r;
        }
      });
    }
    case "destroy": {
      return recordings.filter((r) => r.id !== action.record.id);
    }
    case "set": {
      return action.records || [];
    }
    default: {
      throw Error(`Unknown action: ${action.type}`);
    }
  }
};
