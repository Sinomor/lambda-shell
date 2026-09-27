import AstalNotifd from "gi://AstalNotifd?version=0.1";
import Gtk from "gi://Gtk?version=4.0";
import { bind, For } from "gnim";
import { icons } from "@/src/utils/icons";
import { Notification } from "@/src/modules/notifications/notification";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

export default function Notifications() {
   const notifd = AstalNotifd.get_default();
   const notifications = bind(notifd, "notifications").as((notifs) =>
      notifs.sort((a, b) => b.time - a.time),
   );
   const dnd = bind(notifd, "dont-disturb");
   let scrolled: Gtk.ScrolledWindow;

   const notificationsStyle = style({
      "& > .header": {
         background: theme.colors.bg[1],
         padding: "10px",
         "& button": {
            all: "unset",
            "min-width": "35px",
            "min-height": "35px",
            transition: transition.css,
            "transition-property": "background, color",
            "&:hover": {
               background: theme.colors.bg[2],
            },
            "&:focus": {
               "outline-offset": `-${theme.outline.width}px`,
               outline: theme.outline.css,
            },
         },
         "& .clear": {
            color: theme.colors.red,
            "&:hover": {
               color: theme.colors.redLight,
            },
         },
      },
   });

   return (
      <Gtk.Box
         orientation={Gtk.Orientation.VERTICAL}
         spacing={layout.spacing}
         onMap={() => scrolled.set_vadjustment(null)}
         class={[notificationsStyle, "notifications"]}
      >
         <Gtk.CenterBox class={"header"}>
            <Gtk.Label slot={"start"} label={"Notifications"} />
            <Gtk.Box slot={"end"} spacing={layout.spacing}>
               <Gtk.Button
                  focusOnClick={false}
                  valign={Gtk.Align.CENTER}
                  onClicked={() =>
                     notifd.set_dont_disturb(!notifd.get_dont_disturb())
                  }
               >
                  <Gtk.Image
                     iconName={dnd.as((v) =>
                        v ? icons.bell.off : icons.bell.normal,
                     )}
                     pixelSize={20}
                  />
               </Gtk.Button>
               <Gtk.Button
                  focusOnClick={false}
                  class={"clear"}
                  valign={Gtk.Align.CENTER}
                  onClicked={() =>
                     notifd.notifications.forEach((n) => n.dismiss())
                  }
               >
                  <Gtk.Image iconName={icons.trash} pixelSize={20} />
               </Gtk.Button>
            </Gtk.Box>
         </Gtk.CenterBox>
         <Gtk.ScrolledWindow
            visible={notifications.as((ns) => ns.length !== 0)}
            ref={(self) => (scrolled = self)}
         >
            <Gtk.Box
               orientation={Gtk.Orientation.VERTICAL}
               spacing={layout.spacing}
               vexpand
            >
               <For each={notifications}>
                  {(n) => <Notification n={n} onClose={() => n.dismiss()} />}
               </For>
            </Gtk.Box>
         </Gtk.ScrolledWindow>
         <Gtk.Label
            visible={notifications.as((ns) => ns.length === 0)}
            label={"No notifications"}
            halign={Gtk.Align.CENTER}
            valign={Gtk.Align.CENTER}
            vexpand
            hexpand
         />
      </Gtk.Box>
   );
}
