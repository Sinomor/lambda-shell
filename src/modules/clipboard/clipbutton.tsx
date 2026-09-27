import ClipboardService, {
   type ClipboardEntry,
} from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import { icons } from "@/src/utils/icons";
import { formatTimeAgo } from "@/src/utils";
import { createPoll } from "@gnim-js/io/timer";
import { prop, type GnimNode, type MaybeAccessor } from "gnim";
import { hideSidebar } from "../sidebar";
import { style } from "@gnim-js/gtk4";
import { scale } from "@/src/utils/color";
import { layout, theme, transition } from "@/src/config";

interface ClipButtonProps {
   entry: ClipboardEntry;
   icon: string;
   title: MaybeAccessor<string>;
   children: GnimNode;
}

export default function ClipButton({
   entry,
   icon,
   title,
   children,
}: ClipButtonProps) {
   const clipboard = ClipboardService.get_default();
   const { id } = entry;
   const titleAcc = prop(title, "");
   const timeAgo = createPoll("", 60_000, () => formatTimeAgo(entry.timestamp));

   const buttonStyle = style({
      all: "unset",
      background: theme.colors.bg[1],
      transition: transition.css,
      padding: "10px",
      "transition-property": "background",
      "&:hover": {
         background: theme.colors.bg[2],
      },
      "&:focus": {
         "outline-offset": `-${theme.outline.width}px`,
         outline: theme.outline.css,
      },
      "& .delete": {
         padding: "4px",
         color: theme.colors.red,
         transition: transition.css,
         "transition-property": "background, color",
         "&:hover": {
            background: theme.colors.bg[3],
            color: theme.colors.redLight,
         },
      },
   });

   return (
      <Gtk.Button
         class={buttonStyle}
         focusOnClick={false}
         hexpand={false}
         onClicked={() => {
            clipboard.copy(id);
            hideSidebar();
         }}
      >
         <Gtk.EventControllerKey
            onKeyPressed={(self, keyval) => {
               const widget = self.get_widget();
               if (!widget) return false;
               if (keyval === Gdk.KEY_Delete) {
                  clipboard.delete(id);
                  return true;
               }
               if (keyval === Gdk.KEY_Return) {
                  clipboard.copy(id);
                  hideSidebar();
                  return true;
               }
               return false;
            }}
         />
         <Gtk.Box
            orientation={Gtk.Orientation.VERTICAL}
            spacing={layout.spacing}
         >
            <Gtk.CenterBox class={"header"}>
               <Gtk.Box slot={"start"} spacing={layout.spacing}>
                  <Gtk.Image iconName={icon} pixelSize={20} />
                  <Gtk.Label label={titleAcc} />
               </Gtk.Box>
               <Gtk.Box slot={"end"} spacing={layout.spacing}>
                  <Gtk.Label label={timeAgo} />
                  <Gtk.Box class={"delete"}>
                     <Gtk.GestureClick
                        onPressed={(ctrl, _, x, y) => {
                           const button = ctrl.get_current_button();
                           if (button === Gdk.BUTTON_PRIMARY) {
                              ctrl.set_state(Gtk.EventSequenceState.CLAIMED);
                              clipboard.delete(id);
                           }
                        }}
                     />
                     <Gtk.Image iconName={icons.close} pixelSize={16} />
                  </Gtk.Box>
               </Gtk.Box>
            </Gtk.CenterBox>
            <Gtk.Box class={"content"}>{children}</Gtk.Box>
         </Gtk.Box>
      </Gtk.Button>
   );
}
