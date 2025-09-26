import { execFile } from "child_process";
import log from "@main/logger";

export interface YoutubeDrOptions {
  output?: string;
  format?: string;
  proxy?: string;
  info?: boolean;
  subtitle?: boolean;
  language?: string;
}

class YoutubeDr {
  private info(url: string, options: YoutubeDrOptions): Promise<any> {
    return this.download(url, { ...options, info: true }).then((output) => {
      return JSON.parse(output);
    });
  }

  private buildArgs(url: string, options: YoutubeDrOptions): string[] {
    const {
      output,
      format = "best",
      proxy,
      info,
      subtitle,
      language,
    } = options;

    const args = ["--format", format];

    if (output) {
      args.push("--output", output);
    }
    if (proxy) {
      args.push("--proxy", proxy);
    }
    if (info) {
      args.push("--dump-json");
    }
    if (subtitle) {
      args.push("--write-auto-sub", "--sub-langs", language || "en");
    }

    args.push(url);

    return args;
  }

  download(url: string, options: YoutubeDrOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const args = this.buildArgs(url, options);
      execFile("yt-dlp", args, (err, stdout, stderr) => {
        if (err) {
          log.error(err);
          return reject(err);
        }

        log.info(stdout);
        log.info(stderr);

        resolve(stdout);
      });
    });
  }

  async getMetadata(url: string, options: YoutubeDrOptions) {
    const info = await this.info(url, options);

    return {
      title: info.title,
      description: info.description,
      thumbnail: info.thumbnail,
      duration: info.duration,
    };
  }
}

export default new YoutubeDr();
