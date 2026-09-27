import Astal from "gi://Astal?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import { createState, effect } from "gnim";
import { App } from "@/src/main";
import Workspaces from "./modules/workspaces";
import Tray from "./modules/tray";
import Keyboard from "./modules/keyboard";
import Bluetooth from "./modules/bluetooth";
import Network from "./modules/network";
import Battery from "./modules/battery";
import Recorder from "./modules/recorder";
import Launcher from "./modules/launcher";
import Speaker from "./modules/speaker";
import Clock from "./modules/clock";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

export const barControls = {
   enterFocusMode: () => {},
};
export let enterFocusMode: () => void = () => {};

export default function Bar() {
   const { BOTTOM, TOP, LEFT, RIGHT } = Astal.WindowAnchor;
   const [focusMode, setFocusMode] = createState(false);
   let win: Astal.Window;
   let box: Gtk.Button;

   effect(() => {
      const isActive = focusMode();
      win.set_keymode(isActive ? Astal.Keymode.EXCLUSIVE : Astal.Keymode.NONE);
      win[isActive ? "add_css_class" : "remove_css_class"]("focused");

      if (isActive) {
         box.grab_focus();
      } else {
         win.grab_focus();
      }
   });
   barControls.enterFocusMode = () => {
      setFocusMode(true);
   };

   const barStyle = style({
      all: "unset",
      background: theme.colors.bg[0],
      color: theme.colors.fg[0],
      "box-shadow": `inset -${theme.border.width}px 0 0 0 ${theme.border.color}`,
      "&.focused": {
         "& .barbutton:focus .content": {
            "outline-offset": `-${theme.outline.width}px`,
            outline: theme.outline.css,
         },
         "& popover modelbutton:focus": {
            "outline-offset": `-${theme.border.width}px`,
            outline: theme.outline.css,
         },
      },
      "& .barbutton": {
         all: "unset",
         padding: `0 ${layout.bar.padding}px`,
         "& .content": {
            padding: `${layout.bar.padding + 1}px 0`,
            transition: transition.css,
            "transition-property": "background",
         },
         "&:hover .content": { background: theme.colors.bg[1] },
         "&.active .content": { background: theme.colors.bg[2] },
      },
   });

   return (
      <Astal.Window
         name={"bar"}
         namespace={"bar"}
         class={barStyle}
         anchor={TOP | BOTTOM | LEFT}
         layer={Astal.Layer.TOP}
         keymode={Astal.Keymode.NONE}
         ref={(self) => (win = self)}
         application={App.instance}
         exclusivity={Astal.Exclusivity.EXCLUSIVE}
         visible
      >
         <Gtk.EventControllerKey
            onKeyPressed={(_, keyval) => {
               if (!focusMode.peek()) return false;
               switch (keyval) {
                  case Gdk.KEY_Escape:
                     setFocusMode(false);
                     return true;
                  case Gdk.KEY_Right:
                  case Gdk.KEY_Down:
                     win.child?.child_focus(Gtk.DirectionType.TAB_FORWARD);
                     return true;
                  case Gdk.KEY_Left:
                  case Gdk.KEY_Up:
                     win.child?.child_focus(Gtk.DirectionType.TAB_BACKWARD);
                     return true;
               }
               return false;
            }}
         />
         <Gtk.CenterBox
            class={"content"}
            widthRequest={layout.bar.size}
            orientation={Gtk.Orientation.VERTICAL}
         >
            <Gtk.Box
               slot={"start"}
               class={style({
                  "& > .barbutton:first-child": {
                     "padding-top": `${layout.bar.padding}px`,
                  },
               })}
               spacing={layout.bar.spacing}
               orientation={Gtk.Orientation.VERTICAL}
            >
               <Launcher />
               <Workspaces />
            </Gtk.Box>
            <Gtk.Box
               slot={"end"}
               class={style({
                  "& > .barbutton:last-child": {
                     "padding-bottom": `${layout.bar.padding}px`,
                  },
               })}
               spacing={layout.bar.spacing}
               orientation={Gtk.Orientation.VERTICAL}
            >
               <Tray />
               <Keyboard />
               <Bluetooth ref={(self) => (box = self)} />
               <Network />
               <Speaker />
               <Battery />
               <Recorder />
               <Clock />
            </Gtk.Box>
         </Gtk.CenterBox>
      </Astal.Window>
   );
}
