import AstalApps from "gi://AstalApps?version=0.1";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { createState, effect, For, Accessor, With } from "gnim";
import GLib from "gi://GLib?version=2.0";
import { bash } from "@/src/utils";
import Gio from "gi://Gio?version=2.0";
import { hideSidebar } from "../sidebar";
import AppButton from "./appbutton";
import { layout } from "@/src/config";

export default function Launcher() {
   const apps = new AstalApps.Apps();
   const [text, setText] = createState("");
   const list = text.as((text) => apps.fuzzy_query(text));
   let scrolled: Gtk.ScrolledWindow;
   let entry: Gtk.Entry;

   return (
      <Gtk.Box
         class={"launcher"}
         spacing={layout.spacing}
         onMap={async () => {
            await apps.reload();
            scrolled.set_vadjustment(null);
            setText("");
            entry.set_text("");
            entry.grab_focus();
         }}
         orientation={Gtk.Orientation.VERTICAL}
      >
         <Gtk.Box class={"header"}>
            <Gtk.Entry
               hexpand
               class={"Entry"}
               placeholderText={"Search..."}
               onActivate={() => {
                  const firstApp = list.peek()[0];
                  if (firstApp) firstApp.launch();
                  hideSidebar();
               }}
               ref={(self) => (entry = self)}
               onNotifyText={(self) => {
                  scrolled.set_vadjustment(null);
                  setText(self.text);
               }}
            />
         </Gtk.Box>
         <Gtk.ScrolledWindow
            ref={(self) => (scrolled = self)}
            visible={list.as((list) => list.length > 0)}
            vexpand
         >
            <Gtk.Box
               spacing={layout.spacing}
               orientation={Gtk.Orientation.VERTICAL}
            >
               <For each={list}>{(app) => <AppButton app={app} />}</For>
            </Gtk.Box>
         </Gtk.ScrolledWindow>
         <Gtk.Box
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            vexpand
            visible={list.as((list) => list.length === 0)}
         >
            <Gtk.Label label={"No match found"} />
         </Gtk.Box>
      </Gtk.Box>
   );
}
