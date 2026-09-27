import GObject from "gi://GObject?version=2.0";
import GLib from "gi://GLib?version=2.0";
import { register, property } from "gnim/gobject";
import { execAsync } from "@gnim-js/io/process";
import { bash, dependencies, ensureDirectory, now } from "../utils";
import { icons } from "../utils/icons";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import { interval, Timer } from "@gnim-js/io/timer";

const HOME = GLib.get_home_dir();

@register({ GTypeName: "RecorderService" })
export default class RecorderService extends GObject.Object {
   static instance: RecorderService;

   static get_default(): RecorderService {
      if (!this.instance) this.instance = new RecorderService();
      return this.instance;
   }

   #pid = 0;
   #recordings = `${HOME}/Videos/Screencasting`;
   #file = "";
   #interval?: Timer;
   #recording = false;
   #timer = 0;

   @property
   get recording(): boolean {
      return this.#recording;
   }
   set recording(v: boolean) {
      if (this.#recording !== v) {
         this.#recording = v;
         this.notify("recording");
      }
   }

   @property
   get timer(): number {
      return this.#timer;
   }
   set timer(v: number) {
      if (this.#timer !== v) {
         this.#timer = v;
         this.notify("timer");
      }
   }

   constructor() {
      super();
      this.restore();
   }

   async restore(): Promise<void> {
      try {
         const psOutput = await execAsync(
            "ps -C gpu-screen-reco -o pid,etimes,comm",
         );
         const lines = psOutput
            .trim()
            .split("\n")
            .filter((line) => line.trim() !== "");

         if (lines.length < 2) return;

         const parts = lines[1].trim().split(/\s+/);
         const pid = parseInt(parts[0], 10);
         const elapsedSeconds = parseInt(parts[1], 10);

         if (isNaN(pid) || isNaN(elapsedSeconds)) return;

         this.#pid = pid;
         this.timer = elapsedSeconds;
         this.recording = true;
         this.#interval = interval(1000, () => {
            this.timer++;
         });

         console.log(
            `ScreenRecorder: restored session (pid=${pid}, elapsed=${elapsedSeconds}s)`,
         );
      } catch {}
   }

   async start(): Promise<void> {
      if (!dependencies("gpu-screen-recorder")) return;
      if (this.recording) return;

      try {
         ensureDirectory(this.#recordings);
         this.#file = `${this.#recordings}/${now()}.mp4`;

         this.#pid = parseInt(
            (
               await bash(
                  `gpu-screen-recorder -w screen -q medium -f 30 -a default_output -o "${this.#file}" </dev/null >/dev/null 2>&1 & echo $!`,
               )
            ).trim(),
            10,
         );

         console.log(`ScreenRecorder: started recording to ${this.#file}`);

         this.timer = 0;
         this.recording = true;
         this.#interval = interval(1000, () => {
            this.timer++;
         });
      } catch (error) {
         console.error("ScreenRecorder: failed to start recording: ", error);
         this.recording = false;
      }
   }

   async stop(): Promise<void> {
      if (!this.recording) {
         console.warn("ScreenRecorder: not recording, ignoring stop request");
         return;
      }

      const savedFile = this.#file;
      const savedDir = this.#recordings;

      try {
         if (this.#pid) {
            await bash(`kill -INT ${this.#pid} 2>/dev/null || true`);
         }
         this.#pid = 0;
         this.#interval?.cancel();
         this.recording = false;
         this.timer = 0;

         console.log(`ScreenRecorder: stopped, saved to ${savedFile}`);

         const notification = new AstalNotifd.Notification({
            appName: "Screen Recorder",
            appIcon: icons.video,
            summary: "Screen recording saved",
            body: `File saved at ${savedFile}`,
         });

         notification.add_action(
            new AstalNotifd.Action({ id: "show", label: "Show in Files" }),
         );
         notification.add_action(
            new AstalNotifd.Action({ id: "view", label: "View" }),
         );

         notification.connect("invoked", (_, action) => {
            if (action === "show") bash(`xdg-open ${savedDir}`);
            if (action === "view") bash(`xdg-open ${savedFile}`);
         });

         try {
            AstalNotifd.send_notification(notification, null);
         } catch (error) {
            console.error(
               "ScreenRecorder: failed to send notification: ",
               error,
            );
         }
      } catch (error) {
         console.error("ScreenRecorder: failed to stop recording: ", error);
         this.#interval?.cancel();
         this.recording = false;
      }
   }
}
