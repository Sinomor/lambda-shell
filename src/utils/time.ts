import GLib from "gi://GLib?version=2.0";

export function now() {
   return GLib.DateTime.new_now_local()!.format("%Y-%m-%d_%H-%M-%S");
}
