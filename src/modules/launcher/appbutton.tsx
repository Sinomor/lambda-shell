import AstalApps from "gi://AstalApps?version=0.1";
import AstalNiri from "gi://AstalNiri?version=0.2";
import { hideSidebar } from "../sidebar";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { layout, theme, transition } from "@/src/config";
import { style } from "@gnim-js/gtk4";
import { fileExists, isIcon } from "@/src/utils";

function launchApp(app: AstalApps.Application) {
   const exe = app.executable
      .split(/\s+/)
      .filter((str) => !str.startsWith("%") && !str.startsWith("@"));

   AstalNiri.Message.spawn(exe);
   app.set_frequency(app.get_frequency() + 1);
}

export default function AppButton({ app }: { app: AstalApps.Application }) {
   const buttonStyle = style({
      all: "unset",
      background: theme.colors.bg[1],
      transition: transition.css,
      "transition-property": "background",
      padding: "10px",
      "&:hover": {
         background: theme.colors.bg[2],
      },
      "&:focus": {
         "outline-offset": `-${theme.outline.width}px`,
         outline: theme.outline.css,
      },
   });

   return (
      <Gtk.Button
         class={buttonStyle}
         onClicked={() => {
            launchApp(app);
            hideSidebar();
         }}
         focusOnClick={false}
         vexpand={false}
      >
         <Gtk.Box spacing={layout.spacing}>
            {app.iconName && isIcon(app.iconName) && (
               <Gtk.Image
                  iconName={app.iconName}
                  iconSize={Gtk.IconSize.LARGE}
                  halign={Gtk.Align.CENTER}
                  valign={Gtk.Align.CENTER}
               />
            )}
            {app.iconName && fileExists(app.iconName) && (
               <Gtk.Image
                  file={app.iconName}
                  iconSize={Gtk.IconSize.LARGE}
                  halign={Gtk.Align.CENTER}
                  valign={Gtk.Align.CENTER}
               />
            )}

            <Gtk.Box
               orientation={Gtk.Orientation.VERTICAL}
               spacing={layout.spacing}
            >
               <Gtk.Label
                  ellipsize={Pango.EllipsizeMode.END}
                  label={app.name}
                  valign={Gtk.Align.CENTER}
                  vexpand
                  xalign={0}
               />
               {app.description && (
                  <Gtk.Label
                     ellipsize={Pango.EllipsizeMode.END}
                     label={app.description}
                     vexpand
                     xalign={0}
                  />
               )}
            </Gtk.Box>
         </Gtk.Box>
      </Gtk.Button>
   );
}
