export const conversationsReducer = (
  state: ConversationType[],
  action: {
    type: "create" | "update" | "destroy" | "set";
    record?: ConversationType;
    records?: ConversationType[];
  }
) => {
  switch (action.type) {
    case "create": {
      return [action.record, ...state];
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
