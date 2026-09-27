import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import Adw from "gi://Adw?version=1";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import { icons } from "@/src/utils/icons";
import { fileExists, formatTimeAgo, isIcon } from "@/src/utils";
import { createPoll } from "@gnim-js/io/timer";
import { style } from "@gnim-js/gtk4";
import { behavior, layout, theme, transition } from "@/src/config";

const getUrgencyClass = (n: AstalNotifd.Notification) => {
   const { LOW, NORMAL, CRITICAL } = AstalNotifd.Urgency;
   switch (n.urgency) {
      case LOW:
         return "low";
      case CRITICAL:
         return "critical";
      default:
         return "normal";
   }
};

export interface NotificationProps {
   n: AstalNotifd.Notification;
   showActions?: boolean;
   onClose: () => void;
}

export function Notification({
   n,
   showActions = true,
   onClose,
}: NotificationProps) {
   const width = layout.sidebar.size - layout.sidebar.padding * 2;

   const notificationActions =
      n.actions?.filter((a: any) => a.id !== "default") || [];
   const hasActions = showActions && notificationActions.length > 0;

   const timeAgo = createPoll("", 60_000, () => formatTimeAgo(n.time * 1000));

   const notificationStyle = style({
      background: theme.colors.bg[1],
      padding: "10px",
      "& .critical": {
         color: theme.colors.red,
      },
      "& .close": {
         all: "unset",
         color: theme.colors.red,
         padding: "4px",
         transition: transition.css,
         "transition-property": "background, color",
         "&:hover": {
            background: theme.colors.bg[2],
            color: theme.colors.redLight,
         },
         "&:focus": {
            "outline-offset": `-${theme.outline.width}px`,
            outline: theme.outline.css,
         },
      },
      "& .actions": {
         "& button": {
            all: "unset",
            padding: "5px",
            background: theme.colors.bg[2],
            transition: transition.css,
            "transition-property": "background",
            "&:hover": {
               background: theme.colors.bg[3],
            },
            "&:focus": {
               "outline-offset": `-${theme.outline.width}px`,
               outline: theme.outline.css,
            },
         },
      },
   });

   return (
      <Adw.Clamp maximumSize={width}>
         <Gtk.Box
            orientation={Gtk.Orientation.VERTICAL}
            class={[notificationStyle, getUrgencyClass(n), "notification"]}
            widthRequest={width}
            spacing={layout.spacing}
         >
            <Gtk.Box spacing={layout.spacing} class={"header"}>
               {(n.appIcon || isIcon(n.desktopEntry)) && (
                  <Gtk.Image
                     class={["icon"]}
                     pixelSize={20}
                     iconName={n.appIcon || n.desktopEntry}
                  />
               )}
               <Gtk.Label
                  class={"name"}
                  halign={Gtk.Align.START}
                  ellipsize={Pango.EllipsizeMode.END}
                  label={n.appName || "Unknown"}
               />
               <Gtk.Label
                  class={"time"}
                  hexpand
                  halign={Gtk.Align.END}
                  label={timeAgo}
               />
               <Gtk.Button
                  onClicked={onClose}
                  class={"close"}
                  focusOnClick={false}
                  valign={Gtk.Align.CENTER}
               >
                  <Gtk.Image iconName={icons.close} pixelSize={16} />
               </Gtk.Button>
            </Gtk.Box>
            <Gtk.Box
               spacing={layout.spacing}
               class={"content"}
               valign={Gtk.Align.START}
            >
               {n.image && fileExists(n.image) && (
                  <Adw.Clamp
                     maximumSize={80}
                     halign={Gtk.Align.START}
                     widthRequest={80}
                     heightRequest={80}
                  >
                     <Adw.Clamp
                        orientation={Gtk.Orientation.VERTICAL}
                        maximumSize={80}
                        widthRequest={80}
                        heightRequest={80}
                     >
                        <Gtk.Picture
                           widthRequest={80}
                           heightRequest={80}
                           contentFit={Gtk.ContentFit.COVER}
                           file={Gio.file_new_for_path(n.image)}
                        />
                     </Adw.Clamp>
                  </Adw.Clamp>
               )}
               {n.image && isIcon(n.image) && (
                  <Gtk.Box class={"image"} valign={Gtk.Align.START}>
                     <Gtk.Image
                        iconName={n.image}
                        iconSize={Gtk.IconSize.LARGE}
                        halign={Gtk.Align.CENTER}
                        valign={Gtk.Align.CENTER}
                        heightRequest={80}
                        widthRequest={80}
                     />
                  </Gtk.Box>
               )}
               <Gtk.Label
                  wrap
                  wrapMode={Pango.WrapMode.CHAR}
                  xalign={0}
                  yalign={0}
                  justify={Gtk.Justification.LEFT}
                  ellipsize={Pango.EllipsizeMode.END}
                  singleLineMode
                  lines={4}
                  useMarkup
                  label={n.body || n.summary}
                  hexpand
               />
            </Gtk.Box>
            {hasActions && (
               <Gtk.Box class={"actions"} spacing={layout.spacing}>
                  {notificationActions.map(({ label, id }: any) => (
                     <Gtk.Button
                        hexpand
                        onClicked={() => n.invoke(id)}
                        focusOnClick={false}
                     >
                        <Gtk.Label
                           label={label}
                           halign={Gtk.Align.CENTER}
                           hexpand
                        />
                     </Gtk.Button>
                  ))}
               </Gtk.Box>
            )}
         </Gtk.Box>
      </Adw.Clamp>
   );
}
