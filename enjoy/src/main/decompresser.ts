import { ipcMain } from "electron";
import fs from "fs-extra";
import { readdirSync } from "fs";
import unzipper from "unzipper";
import mainWin from "@main/window";

class Decompresser {
  public tasks: DecompressTask[];

  constructor() {
    this.tasks = [];
  }

  async depress(task: DecompressTask) {
    if (this.tasks.find(({ id }) => task.id === id)) return;
    this.add(task);

    const tempPath = task.destPath + ".depressing";

    if (fs.existsSync(tempPath)) await fs.remove(tempPath);
    const directory = await unzipper.Open.file(task.filePath);
    this.onProgress(task, directory.numberOfRecords);

    await directory.extract({ path: task.destPath + ".depressing" });
    await fs.rename(task.destPath + ".depressing", task.destPath);

    this.done(task);
    this.remove(task);
  }

  async onProgress(task: DecompressTask, total: number) {
    let progress = "0";

    if (fs.existsSync(task.destPath + ".depressing")) {
      const dir = readdirSync(task.destPath + ".depressing", {
        recursive: true,
      });

      progress = ((dir.length / total) * 100).toFixed(0);
    }

    const currentTask = this.tasks.find(({ id }) => id === task.id);

    this.update({ ...currentTask, progress });

    if (currentTask) {
      setTimeout(() => {
        this.onProgress(task, total);
      }, 1000);
    }
  }

  add(task: DecompressTask) {
    this.tasks = [...this.tasks, task];
    this.notify();
  }

  remove(task: DecompressTask) {
    this.tasks = this.tasks.filter(({ id }) => id !== task.id);
    this.notify();
  }

  update(task: DecompressTask) {
    const index = this.tasks.findIndex(({ id }) => id === task.id);

    if (index > -1) {
      this.tasks.splice(index, 1, task);
      this.notify();
    }
  }

  notify() {
    mainWin.win.webContents.send("decompress-tasks-update", this.tasks);
  }

  done(task: DecompressTask) {
    mainWin.win.webContents.send("decompress-task-done", task);
  }

  registerIpcHandlers() {
    ipcMain.handle("decompress-tasks", () => {
      return this.tasks;
    });
  }
}

export default new Decompresser();
