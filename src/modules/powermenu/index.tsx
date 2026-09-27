import GLib from "gi://GLib?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import Graphene from "gi://Graphene?version=1.0";
import { createState } from "gnim";
import { App } from "@/src/main";
import Gdk from "gi://Gdk?version=4.0";
import { icons } from "@/src/utils/icons";
import { bash } from "@/src/utils";
import { Reveal } from "@/src/widgets/reveal";
import Astal from "gi://Astal?version=4.0";
import { style } from "@gnim-js/gtk4";
import { Grid, GridChild } from "@/src/widgets/grid";
import { layout, theme, transition } from "@/src/config";

export const [visible, setVisible] = createState(false);
export const [revealed, setRevealed] = createState(false);

function getPowermenu() {
   return App.instance.get_windows().find((w) => w.name === "powermenu");
}
export function hidePowermenu() {
   getPowermenu()?.hide();
}
export function showPowermenu() {
   getPowermenu()?.show();
}
export function togglePowermenu() {
   const win = getPowermenu();
   if (!win) return;

   if (!win.visible) {
      showPowermenu();
   } else {
      hidePowermenu();
   }
}

export default function Powermenu() {
   const { BOTTOM, TOP, LEFT, RIGHT } = Astal.WindowAnchor;
   let box: Gtk.Box;
   let revealWidget: Reveal;
   let win: Gtk.Window;
   const user = GLib.getenv("USER");

   const commands = {
      sleep: "systemctl suspend",
      reboot: "systemctl reboot",
      logout: `loginctl terminate-user ${user}`,
      shutdown: "shutdown now",
   } as Record<string, any>;
   const list = ["Sleep", "Logout", "Reboot", "Shutdown"];

   function show() {
      revealWidget.revealChild = true;
      win.set_visible(true);
   }
   function hide() {
      revealWidget.revealChild = false;
   }

   const powermenuStyle = style({
      all: "unset",
      "& .content": {
         background: theme.colors.bg[0],
         border: theme.border.css,
         padding: "15px",
         "& button": {
            all: "unset",
            transition: transition.css,
            "transition-property": "background",
            background: theme.colors.bg[1],
            padding: "0 10px",
            "min-height": "55px",
            "&:hover": {
               background: theme.colors.bg[2],
            },
            "&:focus": {
               "outline-offset": `-${theme.outline.width}px`,
               outline: theme.outline.css,
            },
         },
      },
   });

   return (
      <Astal.Window
         name={"powermenu"}
         namespace={"powermenu"}
         class={powermenuStyle}
         anchor={TOP | BOTTOM | LEFT | RIGHT}
         layer={Astal.Layer.OVERLAY}
         keymode={Astal.Keymode.ON_DEMAND}
         application={App.instance}
         visible={visible}
         ref={(self) => {
            Object.assign(self, { show, hide });
            win = self;
         }}
         onNotifyVisible={({ visible }) => {
            if (visible) box.grab_focus();
         }}
      >
         <Gtk.EventControllerKey
            onKeyPressed={(self, keyval) => {
               const widget = self.get_widget();
               if (!widget) return false;
               if (keyval === Gdk.KEY_Escape) {
                  widget.hide();
                  return true;
               }
               return false;
            }}
         />
         <Gtk.GestureClick
            onPressed={(self, _n, x, y) => {
               const widget = self.get_widget();
               if (!widget || !box) return;
               const [, rect] = box.compute_bounds(widget);
               if (rect.contains_point(new Graphene.Point({ x, y }))) return;
               widget.hide();
            }}
         />
         <Reveal
            valign={Gtk.Align.CENTER}
            halign={Gtk.Align.CENTER}
            translateY={0}
            startScale={0.95}
            transitionDuration={transition.duration}
            onHidden={() => win.set_visible(false)}
            ref={(self) => (revealWidget = self)}
         >
            <Gtk.Box
               spacing={layout.spacing}
               orientation={Gtk.Orientation.VERTICAL}
               class={"content"}
               focusable
               ref={(self) => (box = self)}
            >
               {list.map((value, index) => (
                  <Gtk.Button
                     onClicked={() => {
                        bash(commands[value.toLowerCase()]);
                        hidePowermenu();
                     }}

                     focusOnClick={false}
                  >
                     <Gtk.Box spacing={layout.spacing}>
                        <Gtk.Image
                           iconName={icons.powermenu[value.toLowerCase()]}
                           pixelSize={20}
                        />
                        <Gtk.Label label={value} />
                     </Gtk.Box>
                  </Gtk.Button>
               ))}
            </Gtk.Box>
         </Reveal>
      </Astal.Window>
   );
}
