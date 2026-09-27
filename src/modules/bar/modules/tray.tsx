import AstalTray from "gi://AstalTray?version=0.1";
import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import { bind, connectSignal, createState, For } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import { icons } from "@/src/utils/icons";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

export default function Tray() {
   const tray = AstalTray.get_default();
   const items = bind(tray, "items").as((items) =>
      items.filter((item) => item.id !== null),
   );
   const [revealed, setRevealed] = createState(false);

   function Item({ item }: { item: AstalTray.TrayItem }) {
      let popover: Gtk.PopoverMenu;
      let button: Gtk.Button;

      const popoverStyle = style({
         "& contents": {
            background: theme.colors.bg[0],
            border: theme.border.css,
            padding: "5px",
            "margin-left": "15px",
         },
         "& modelbutton": {
            padding: "5px 10px",
            transition: transition.css,
            "transition-property": "background",
            "&:hover": {
               background: theme.colors.bg[1],
            },
         },
         "& separator": {
            margin: "5px 0",
         },
      });

      connectSignal(item, "notify::action-group", () =>
         popover.insert_action_group("dbusmenu", item.actionGroup),
      );
      connectSignal(item, "notify::menu-model", () =>
         popover.set_menu_model(item.menuModel),
      );

      return (
         <BarButton
            ref={(self) => (button = self)}
            onClicked={(ctrl, x, y) => {
               if (ctrl === undefined) {
                  item.about_to_show();
                  popover.visible ? popover.popdown() : popover.popup();
               } else {
                  item.activate(x ?? 0, y ?? 0);
               }
            }}
            onSecondaryClicked={() => {
               item.about_to_show();
               popover.visible ? popover.popdown() : popover.popup();
            }}
            onMiddleClicked={(_, x, y) =>
               item.secondary_activate(x ?? 0, y ?? 0)
            }
         >
            <Gtk.Image
               gicon={bind(item, "gicon")}
               tooltipMarkup={bind(item, "tooltip-markup")}
               pixelSize={20}
               hexpand
            />
            <Gtk.PopoverMenu
               class={popoverStyle}
               menuModel={bind(item, "menu-model")}
               position={Gtk.PositionType.RIGHT}
               hasArrow={false}
               onNotifyVisible={({ visible }) =>
                  button[visible ? "add_css_class" : "remove_css_class"](
                     "active",
                  )
               }
               ref={(self) => (popover = self)}
            />
         </BarButton>
      );
   }

   return (
      <Gtk.Box
         orientation={Gtk.Orientation.VERTICAL}
         spacing={layout.bar.spacing}
      >
         <Gtk.Revealer
            revealChild={revealed}
            transitionType={Gtk.RevealerTransitionType.SLIDE_UP}
            transitionDuration={transition.duration}
         >
            <Gtk.Box
               orientation={Gtk.Orientation.VERTICAL}
               spacing={layout.bar.spacing}
            >
               <For each={items}>{(item) => <Item item={item} />}</For>
            </Gtk.Box>
         </Gtk.Revealer>
         <BarButton
            onClicked={() => {
               setRevealed((v) => !v);
            }}
         >
            <Gtk.Image
               iconName={revealed.as((v) =>
                  v ? icons.chevron.down : icons.chevron.up,
               )}
               pixelSize={20}
            />
         </BarButton>
      </Gtk.Box>
   );
}
