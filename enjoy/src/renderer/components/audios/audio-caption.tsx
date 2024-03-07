import { createContext, useEffect, useState, useContext, useRef } from "react";
import {
  MediaPlayerProviderContext,
  AppSettingsProviderContext,
} from "@renderer/context";
import { t } from "i18next";

export const AudioCaption = () => {
  const { currentSegmentIndex, currentTime, transcription } = useContext(
    MediaPlayerProviderContext
  );
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const caption = transcription?.result?.[currentSegmentIndex];

  useEffect(() => {
    if (!caption) return;
    const time = Math.round(currentTime * 1000);
    const index = caption.segments.findIndex(
      (w) => time >= w.offsets.from && time < w.offsets.to
    );

    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [currentTime, caption]);

  if (!caption) return <div></div>;

  return (
    <div className="flex items-start space-x-4 p-4">
      <div className="flex-1 text-xl font-serif">
        <div className="flex flex-wrap">
          {(caption.segments || []).map((w, index) => (
            <div
              key={index}
              className={`mr-1 cursor-pointer hover:bg-red-500/10 ${
                index === activeIndex ? "text-red-500" : ""
              }`}
              onClick={(event) => {}}
            >
              <div>{w.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
