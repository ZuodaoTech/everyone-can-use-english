export const llmMessagesReducer = (
  state: LlmMessageType[],
  action: {
    type: "create" | "update" | "destroy" | "set";
    record?: LlmMessageType;
    records?: LlmMessageType[];
  }
) => {
  switch (action.type) {
    case "create": {
      const index = state.findIndex((c) => c.id === action.record.id);
      if (index === -1) {
        state.push(action.record);
      } else {
        state[index] = action.record;
      }

      return [...state];
    }
    case "update": {
      return state.map((c) => {
        if (c.id === action.record.id) {
          return action.record;
        } else {
          return c;
        }
      });
    }
    case "destroy": {
      return state.filter((c) => c.id !== action.record.id);
    }
    case "set": {
      return action.records || [];
    }
    default: {
      throw Error(`Unknown action: ${action.type}`);
    }
  }
};
