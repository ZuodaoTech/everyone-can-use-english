import { ipcMain } from "electron";
import settings from "@main/settings";
import path from "path";
import fs from "fs-extra";

export class Waveform {
  public dir = path.join(settings.libraryPath(), "waveforms");

  constructor() {
    fs.ensureDirSync(this.dir);
  }

  find(id: string) {
    const file = path.join(this.dir, id + ".waveform.json");

    if (fs.existsSync(file)) {
      return fs.readJsonSync(file);
    } else {
      return null;
    }
  }

  save(id: string, data: WaveFormDataType) {
    const file = path.join(this.dir, id + ".waveform.json");

    fs.writeJsonSync(file, data);
  }

  registerIpcHandlers() {
    ipcMain.handle("waveforms-find", async (_event, id) => {
      return this.find(id);
    });

    ipcMain.handle("waveforms-save", (_event, id, data) => {
      return this.save(id, data);
    });
  }
}

export default new Waveform();