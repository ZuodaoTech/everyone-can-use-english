export const messagesReducer = (
  messages: MessageType[],
  action: {
    type: "append" | "create" | "update" | "destroy" | "set";
    record?: MessageType;
    records?: MessageType[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...messages, action.record];
      } else if (action.records) {
        return [...messages, ...action.records];
      } else {
        return messages;
      }
    }
    case "create": {
      return [action.record, ...messages];
    }
    case "update": {
      return messages.map((m) => {
        if (m.id === action.record.id) {
          return Object.assign({}, m, action.record);
        } else {
          return m;
        }
      });
    }
    case "destroy": {
      return messages.filter((m) => m.id !== action.record.id);
    }
    case "set": {
      return action.records || [];
    }
    default: {
      throw Error(`Unknown action: ${action.type}`);
    }
  }
};
