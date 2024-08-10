export const chatSessionsReducer = (
  chatSessions: ChatSessionType[],
  action: {
    type: "append" | "prepend" | "update" | "remove" | "set";
    record?: ChatSessionType;
    records?: ChatSessionType[];
    message?: ChatMessageType;
    recording?: RecordingType;
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...chatSessions, action.record];
      } else if (action.records) {
        return [...chatSessions, ...action.records];
      } else {
        return chatSessions;
      }
    }
    case "prepend": {
      return [action.record, ...chatSessions];
    }
    case "update": {
      return chatSessions.map((chatSession) => {
        if (chatSession.id === action.record.id) {
          return Object.assign(chatSession, action.record);
        } else {
          return chatSession;
        }
      });
    }
    case "remove": {
      return chatSessions.filter(
        (chatSession) => chatSession.id !== action.record.id
      );
    }
    case "set": {
      return action.records || [];
    }
    default: {
      throw Error(`Unknown action: ${action.type}`);
    }
  }
};
