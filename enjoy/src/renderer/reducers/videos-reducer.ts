export const videosReducer = (
  videos: VideoType[],
  action: {
    type: "append" | "create" | "update" | "destroy" | "set";
    record?: Partial<VideoType>;
    records?: Partial<VideoType>[];
  }
) => {
  switch (action.type) {
    case "append": {
      if (action.record) {
        return [...videos, action.record];
      } else if (action.records) {
        return [...videos, ...action.records];
      } else {
        return videos;
      }
    }
    case "create": {
      return [action.record, ...videos];
    }
    case "update": {
      return videos.map((video) => {
        if (video.id === action.record.id) {
          return Object.assign(video, action.record);
        } else {
          return video;
        }
      });
    }
    case "destroy": {
      return videos.filter((video) => video.id !== action.record.id);
    }
    case "set": {
      return action.records || [];
    }
    default: {
      throw Error(`Unknown action: ${action.type}`);
    }
  }
};
