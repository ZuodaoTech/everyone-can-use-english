import { ipcMain } from "electron";
import { align } from "echogarden/dist/api/API.js";
import { AlignmentOptions } from "echogarden/dist/api/API";
import { AudioSourceParam } from "echogarden/dist/audio/AudioUtilities";

class EchogardenWrapper {
  align: typeof align;

  constructor() {
    this.align = align;
  }

  registerIpcHandlers() {
    ipcMain.handle(
      "echogarden-align",
      async (
        _event,
        input: AudioSourceParam,
        transcript: string,
        options: AlignmentOptions
      ) => {
        return this.align(input, transcript, options);
      }
    );
  }
}

export default new EchogardenWrapper();
