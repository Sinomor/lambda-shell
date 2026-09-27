import GLib from "gi://GLib?version=2.0";

export function formatBytes(bytes: number): string {
   if (bytes <= 0) return "0 B";
   const units = ["B", "KiB", "MiB", "GiB"];
   const i = Math.min(
      Math.floor(Math.log(bytes) / Math.log(1024)),
      units.length - 1,
   );
   const value = bytes / 1024 ** i;
   return `${i === 0 ? value : value.toFixed(1)} ${units[i]}`;
}

export function toBytes(size: number, unit: string): number {
   const multipliers: Record<string, number> = {
      "": 1,
      K: 1024,
      Ki: 1024,
      M: 1024 ** 2,
      Mi: 1024 ** 2,
      G: 1024 ** 3,
      Gi: 1024 ** 3,
      T: 1024 ** 4,
      Ti: 1024 ** 4,
   };
   return Math.round(size * (multipliers[unit] ?? 1));
}

export function formatTimeAgo(time: number): string {
   const now = GLib.DateTime.new_now_local();
   if (!now) return "";

   const seconds = Math.floor(time / 1000);
   const then = GLib.DateTime.new_from_unix_local(seconds);
   if (!then) return "";

   const diff = now.difference(then) / 1_000_000;

   if (diff < 60) return "now";
   if (diff < 3600) {
      const m = Math.floor(diff / 60);
      return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
   }
   if (diff < 86400) {
      const h = Math.floor(diff / 3600);
      return `${h} ${h === 1 ? "hour" : "hours"} ago`;
   }
   const d = Math.floor(diff / 86400);
   if (d === 1) return "yesterday";
   return `${d} days ago`;
}

export function truncateLines(text: string, maxLines: number): string {
   const lines = text.split("\n");
   if (lines.length <= maxLines) return text;
   return lines.slice(0, maxLines).join("\n") + "\n…";
}
