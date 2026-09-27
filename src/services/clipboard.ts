import GLib from "gi://GLib?version=2.0";
import Gio from "gi://Gio?version=2.0";
import GObject from "gi://GObject?version=2.0";
import { property, register } from "gnim/gobject";
import { bash, dependencies, ensureDirectory, toBytes } from "../utils";
import { subprocess } from "@gnim-js/io/process";
import { computed, createRoot } from "gnim";
import {
   classifyCode as classifyCodeContent,
   highlightMarkup as renderCodeMarkup,
} from "../utils/code";
import GdkPixbuf from "gi://GdkPixbuf?version=2.0";
import Gdk from "gi://Gdk?version=4.0";
import { behavior } from "../config";

const tmpDir = `${GLib.get_tmp_dir()}/clipvault`;

export type ClipboardKind = "text" | "color" | "image" | "file" | "code";

export interface ClipboardImageMeta {
   format: string;
   width: number;
   height: number;
}

export interface ClipboardEntry {
   id: string;
   preview: string;
   kind: ClipboardKind;
   timestamp: number;
   image?: ClipboardImageMeta;
   languageId?: string | null;
}

const IMAGE_PATTERN =
   /\[\[ binary data (\d+)\s*([KMGTkmgt]i?)?B ([\w/]+) (\d+)x(\d+) \]\]/;

const FILE_URI_TOKEN = /^file:\/\/\S+$/;

@register({ GTypeName: "ClipboardService" })
export default class ClipboardService extends GObject.Object {
   static instance: ClipboardService;
   static get_default(): ClipboardService {
      if (!this.instance) this.instance = new ClipboardService();
      return this.instance;
   }

   #list: ClipboardEntry[] = [];
   #contentCache = new Map<string, string>();

   @property
   get list(): ClipboardEntry[] {
      return this.#list;
   }
   set list(v: ClipboardEntry[]) {
      if (this.#list !== v) {
         this.#list = v;
         this.notify("list");
      }
   }

   constructor() {
      super();
      if (dependencies("clipvault")) this.start();
   }

   private async start() {
      await bash(`pkill -f "wl-paste.*clipvault"`);
      await bash(`pkill -f "wl-paste.*echo"`);
      await bash(`rm -rf ${tmpDir}`);
      ensureDirectory(tmpDir);

      createRoot(() => {
         bash(
            `wl-paste --type text --watch clipvault store --max-entries ${behavior.clipboard.maxEntries} --window-ignore-pattern "org.gnome.World.Secrets" `,
         );
         bash(
            `wl-paste --type image --watch clipvault store --max-entries ${behavior.clipboard.maxEntries}`,
         );
         bash(
            `wl-paste --type text/uri-list --watch clipvault store --max-entries ${behavior.clipboard.maxEntries}`,
         );

         subprocess(`wl-paste --watch echo "changed"`, () => {
            this.#scheduleUpdate();
         });
      });

      this.update();
   }

   #updateTimeout: number | null = null;
   #scheduleUpdate(delay = 200): void {
      if (this.#updateTimeout !== null) {
         GLib.source_remove(this.#updateTimeout);
      }
      this.#updateTimeout = GLib.timeout_add(
         GLib.PRIORITY_DEFAULT,
         delay,
         () => {
            this.#updateTimeout = null;
            this.update();
            return GLib.SOURCE_REMOVE;
         },
      );
   }

   private async update() {
      try {
         const raw = await bash(
            "clipvault list --fields=id,preview,last-updated",
         );
         if (!raw.trim()) {
            this.list = [];
            this.#contentCache.clear();
            return;
         }

         const prevById = new Map(this.#list.map((e) => [e.id, e]));
         const nextIds = new Set<string>();

         const entries = raw
            .split("\n")
            .filter((line) => line.trim())
            .map((line) => {
               const firstTab = line.indexOf("\t");
               const lastTab = line.lastIndexOf("\t");
               const id = firstTab === -1 ? line : line.slice(0, firstTab);
               nextIds.add(id);

               const preview =
                  firstTab === -1 || firstTab === lastTab
                     ? ""
                     : line.slice(firstTab + 1, lastTab);

               const prev = prevById.get(id);
               if (prev && prev.preview === preview) return prev; // пропускаем reclassify

               const ts =
                  firstTab === -1 || firstTab === lastTab
                     ? Date.now()
                     : (() => {
                          const p = Date.parse(line.slice(lastTab + 1));
                          return Number.isNaN(p) ? Date.now() : p;
                       })();

               return this.#parseEntry(id, preview, ts);
            });

         for (const id of this.#contentCache.keys()) {
            if (!nextIds.has(id)) this.#contentCache.delete(id);
         }

         this.list = entries;
      } catch (error) {
         console.error(error);
         this.list = [];
      }
   }

   #parseEntry(
      id: string,
      rawPreview: string,
      timestamp: number,
   ): ClipboardEntry {
      const preview = rawPreview.trim();

      if (this.#looksLikeFileUriList(preview)) {
         return { id, preview, kind: "file", timestamp };
      }

      const imageMatch = preview.match(IMAGE_PATTERN);
      if (imageMatch) {
         const [, , , format, width, height] = imageMatch;
         return {
            id,
            preview,
            kind: "image",
            timestamp,
            image: {
               format,
               width: Number(width),
               height: Number(height),
            },
         };
      }

      const gdkColor = new Gdk.RGBA();
      if (gdkColor.parse(preview)) {
         return { id, preview, kind: "color", timestamp };
      }

      const { isCode, languageId } = classifyCodeContent(preview);
      if (isCode) {
         return { id, preview, kind: "code", timestamp, languageId };
      }

      return { id, preview, kind: "text", timestamp };
   }

   #looksLikeFileUriList(preview: string): boolean {
      const tokens = preview.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return false;
      return tokens.every((token) => FILE_URI_TOKEN.test(token));
   }

   async getContent(id: string): Promise<string> {
      const cached = this.#contentCache.get(id);
      if (cached !== undefined) return cached;

      try {
         const content = await bash(`clipvault get ${id}`);
         this.#contentCache.set(id, content);
         return content;
      } catch (error) {
         console.error(error);
         return "";
      }
   }

   classifyCode(content: string) {
      return classifyCodeContent(content);
   }

   highlightMarkup(
      content: string,
      languageId: string,
      maxLines = behavior.clipboard.maxCodeLines,
   ) {
      return renderCodeMarkup(content, languageId, maxLines);
   }

   promoteToCode(id: string, languageId: string | null): void {
      const idx = this.#list.findIndex((e) => e.id === id);
      if (idx === -1 || this.#list[idx].kind !== "text") return;

      const next = [...this.#list];
      next[idx] = { ...next[idx], kind: "code", languageId };
      this.list = next;
   }

   parseUriList(content: string): string[] {
      return content
         .split("\n")
         .map((line) => line.trim())
         .filter((line) => line && !line.startsWith("#"))
         .map((uri) => {
            try {
               const [path] = GLib.filename_from_uri(uri);
               return path;
            } catch {
               return uri;
            }
         });
   }

   async loadImage(id: string): Promise<string | undefined> {
      const imagePath = `${tmpDir}/${id}.png`;

      if (GLib.file_test(imagePath, GLib.FileTest.EXISTS)) {
         return imagePath;
      }

      try {
         await bash(`clipvault get ${id} > ${imagePath}`);

         const pixbuf = GdkPixbuf.Pixbuf.new_from_file_at_scale(
            imagePath,
            behavior.clipboard.imagePreviewSize,
            behavior.clipboard.imagePreviewSize,
            true,
         );
         if (!pixbuf) throw new Error(`failed to decode image: ${imagePath}`);
         pixbuf.savev(imagePath, "png", [], []);

         return imagePath;
      } catch (error) {
         console.error(error);
         GLib.unlink(imagePath);
         return undefined;
      }
   }

   copy(id: string): void {
      const entry = this.#list.find((e) => e.id === id);
      const typeFlag =
         entry?.kind === "file"
            ? "--type text/uri-list"
            : entry?.kind === "image" && entry.image?.format
              ? `--type ${entry.image.format}`
              : "";
      bash(`clipvault get ${id} | wl-copy ${typeFlag}`);
   }

   async delete(id: string): Promise<void> {
      await bash(`echo "${id}" | clipvault delete`);
      this.update();
   }

   async clear() {
      await bash("clipvault clear");
      this.update();
   }
}
