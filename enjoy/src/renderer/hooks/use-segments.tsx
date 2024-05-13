import { useContext, useEffect, useState } from "react";
import { AppSettingsProviderContext } from "../context";
import { toast } from "@renderer/components/ui";

export const useSegments = (props: {
  targetId: string;
  targetType: string;
  segmentIndex: number;
}) => {
  const { targetId, targetType, segmentIndex } = props;
  const { EnjoyApp } = useContext(AppSettingsProviderContext);
  const [segment, setSegment] = useState<SegmentType>();

  const findSegment = () => {
    if (!targetId || !targetType) return;

    EnjoyApp.segments
      .findAll({
        targetId,
        targetType,
        segmentIndex,
      })
      .then((segments) => {
        setSegment(segments[0]);
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  const createSegment = () => {
    return EnjoyApp.segments
      .create({
        targetId,
        targetType,
        segmentIndex,
      })
      .then((segment) => {
        setSegment(segment);
        return segment;
      })
      .catch((err) => {
        toast.error(err.message);
      });
  };

  useEffect(() => {
    findSegment();
  }, [targetId, targetType, segmentIndex]);

  return {
    segment,
    createSegment,
  };
};
