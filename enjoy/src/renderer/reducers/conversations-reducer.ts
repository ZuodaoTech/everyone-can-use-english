export const conversationsReducer = (
  state: ConversationType[],
  action: {
    type: "append" | "create" | "update" | "destroy" | "set";
    record?: ConversationType;
    records?: ConversationType[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...state, action.record];
      } else if (action.records) {
        return [...state, ...action.records];
      }
    }
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
