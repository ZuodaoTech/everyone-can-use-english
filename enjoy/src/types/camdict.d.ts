type CamdictWordType = {
  id: number;
  oid: string;
  word: string;
  posItems: CamdictPosItemType[];
  updatedAt: Date;
  createdAt: Date;
};

type CamdictPosItemType = {
  type: string;
  definitions: {
    definition: string;
    examples?: string[];
  }[];
  pronunciations: {
    audio: string;
    pronunciation: string;
    region: string;
  }[];
};
