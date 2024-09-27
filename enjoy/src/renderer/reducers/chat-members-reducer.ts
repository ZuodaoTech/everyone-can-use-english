export const chatMembersReducer = (
  chatMembers: ChatMemberType[],
  action: {
    type: "append" | "prepend" | "update" | "remove" | "set";
    record?: ChatMemberType;
    records?: ChatMemberType[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...chatMembers, action.record];
      } else if (action.records) {
        return [...chatMembers, ...action.records];
      } else {
        return chatMembers;
      }
    }
    case "prepend": {
      return [action.record, ...chatMembers];
    }
    case "update": {
      return chatMembers.map((chatMember) => {
        if (chatMember.id === action.record.id) {
          return Object.assign(chatMember, action.record);
        } else {
          return chatMember;
        }
      });
    }
    case "remove": {
      return chatMembers.filter(
        (chatMember) => chatMember.id !== action.record.id
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
