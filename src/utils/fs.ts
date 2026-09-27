import GLib from "gi://GLib?version=2.0";

export function ensureDirectory(path: string): void {
   if (!GLib.file_test(path, GLib.FileTest.IS_DIR)) {
      GLib.mkdir_with_parents(path, 0o755);
   }
}

export function fileExists(path: string): boolean {
   return GLib.file_test(path, GLib.FileTest.EXISTS);
}
