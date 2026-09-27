import ClipboardService, {
   ClipboardKind,
   type ClipboardEntry,
} from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import { bind, computed, createState, effect, FC, For } from "gnim";
import { icons } from "@/src/utils/icons";
import Text from "./items/text";
import Code from "./items/code";
import Image from "./items/image";
import Color from "./items/color";
import File from "./items/file";
import { hideSidebar } from "../sidebar";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

export default function Clipboard() {
   const COMPONENTS: Record<ClipboardKind, FC<{ entry: ClipboardEntry }>> = {
      color: Color,
      image: Image,
      file: File,
      code: Code,
      text: Text,
   };
   const clipboard = ClipboardService.get_default();
   const items = bind(clipboard, "list");
   const [text, setText] = createState("");
   const list = computed(() => {
      const input = text();
      return items().filter((entry) => {
         if (!input) return true;
         return entry.preview.toLowerCase().includes(input.toLowerCase());
      });
   });
   let scrolled: Gtk.ScrolledWindow;
   let entry: Gtk.Entry;

   const clearStyle = style({
      all: "unset",
      transition: transition.css,
      "min-height": "35px",
      "min-width": "35px",
      "transition-property": "color, background",
      color: theme.colors.red,
      "&:hover": {
         color: theme.colors.redLight,
         background: theme.colors.bg[2],
      },
   });

   return (
      <Gtk.Box
         class={"clipboard"}
         spacing={layout.spacing}
         onMap={() => {
            scrolled.set_vadjustment(null);
            setText("");
            entry.set_text("");
            entry.grab_focus();
         }}
         orientation={Gtk.Orientation.VERTICAL}
         hexpand
      >
         <Gtk.Box class={"header"}>
            <Gtk.Entry
               ref={(self) => (entry = self)}
               hexpand
               placeholderText={"Search..."}
               onActivate={() => {
                  const item = list.peek()[0];
                  if (!item) return;
                  clipboard.copy(item.id);
                  hideSidebar();
               }}
               onNotifyText={({ text }) => {
                  scrolled.set_vadjustment(null);
                  setText(text);
               }}
            />
            <Gtk.Button
               class={clearStyle}
               focusable={false}
               valign={Gtk.Align.CENTER}
               onClicked={async () => await clipboard.clear()}
            >
               <Gtk.Image iconName={icons.trash} pixelSize={20} />
            </Gtk.Button>
         </Gtk.Box>
         <Gtk.ScrolledWindow
            ref={(self) => (scrolled = self)}
            visible={list.as((list) => list.length !== 0)}
         >
            <Gtk.Box
               spacing={layout.spacing}
               vexpand
               orientation={Gtk.Orientation.VERTICAL}
            >
               <For each={list}>
                  {(item) => {
                     const Comp = COMPONENTS[item.kind] ?? Text;
                     return <Comp entry={item} />;
                  }}
               </For>
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
