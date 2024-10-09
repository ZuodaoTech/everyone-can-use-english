export const chatMessagesReducer = (
  chatMessages: ChatMessageType[],
  action: {
    type: "append" | "prepend" | "update" | "remove" | "set";
    record?: ChatMessageType;
    records?: ChatMessageType[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        if (chatMessages.find((m) => m.id === action.record.id)) {
          return chatMessages;
        }
        return [...chatMessages, action.record];
      } else if (action.records) {
        return [...chatMessages, ...action.records];
      } else {
        return chatMessages;
      }
    }
    case "prepend": {
      return [action.record, ...chatMessages];
    }
    case "update": {
      return chatMessages.map((chatMessage) => {
        if (action.record && chatMessage.id === action.record.id) {
          return Object.assign(chatMessage, action.record);
        } else {
          return chatMessage;
        }
      });
    }
    case "remove": {
      return chatMessages.filter(
        (chatMessage) => chatMessage.id !== action.record.id
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
