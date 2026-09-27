import { bind, computed, For } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import Gtk from "gi://Gtk?version=4.0";
import { attachHoverScroll, getApp } from "@/src/utils";
import { icons } from "@/src/utils/icons";
import Gdk from "gi://Gdk?version=4.0";
import AstalNiri from "gi://AstalNiri?version=0.2";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

export default function Workspaces() {
   const niri = AstalNiri.get_default();
   const workspaces = bind(niri, "workspaces");
   const focusedWorkspace = bind(niri, "focused-workspace");
   const focusedWindow = bind(niri, "focused-window");

   function Window({ win }: { win: AstalNiri.Window }) {
      const windowStyle = style({
         "& .indicator": {
            "min-width": "2px",
            "min-height": "4px",
            background: theme.colors.bg[3],
            transition: transition.css,
            "transition-property": "min-height, background",
         },
         "&.active .indicator": {
            background: theme.colors.accent,
            "min-height": "8px",
         },
      });
      const classes = computed(() => {
         const classes = [windowStyle, "window"];
         const isActive = focusedWindow()?.id === win.id;
         if (isActive) classes.push("active");
         return classes;
      });
      const app = getApp(win.appId);
      let revealer: Gtk.Revealer;

      return (
         <Gtk.Overlay class={classes} tooltipText={bind(win, "title")}>
            <Gtk.GestureClick
               onPressed={(ctrl) => {
                  const button = ctrl.get_current_button();
                  ctrl.set_state(Gtk.EventSequenceState.CLAIMED);
                  if (button === Gdk.BUTTON_PRIMARY) {
                     win.focus();
                  } else if (button === Gdk.BUTTON_MIDDLE) {
                     win.close();
                  }
               }}
               button={0}
            />
            <Gtk.Box
               slot={"overlay"}
               class={"indicator"}
               valign={Gtk.Align.CENTER}
               halign={Gtk.Align.START}
               vexpand
               hexpand
            />
            <Gtk.Image
               iconName={app?.iconName ?? icons["app-default"]}
               pixelSize={20}
               hexpand
            />
         </Gtk.Overlay>
      );
   }

   function Workspace({ ws }: { ws: AstalNiri.Workspace }) {
      const windows = bind(ws, "windows");
      const idx = bind(ws, "idx");

      return (
         <BarButton
            class={"workspace"}
            active={focusedWorkspace.as((fws) => fws?.idx === ws.idx)}
            onClicked={() => ws.focus()}
         >
            <Gtk.Label label={idx.as(String)} />
            <For each={windows}>{(win) => <Window win={win} />}</For>
         </BarButton>
      );
   }

   return (
      <Gtk.Box
         spacing={layout.bar.spacing}
         orientation={Gtk.Orientation.VERTICAL}
         ref={(self) =>
            attachHoverScroll(self, ({ dy }) => {
               if (dy < 0) AstalNiri.Message.focus_workspace_up();
               else if (dy > 0) AstalNiri.Message.focus_workspace_down();
            })
         }
      >
         <For each={workspaces}>{(ws) => <Workspace ws={ws} />}</For>
      </Gtk.Box>
   );
}
