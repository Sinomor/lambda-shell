import Astal from "gi://Astal?version=4.0";
import Gtk from "gi://Gtk?version=4.0";
import Gdk from "gi://Gdk?version=4.0";
import Graphene from "gi://Graphene?version=1.0";
import { createState, createStore, For } from "gnim";
import { App } from "../../main";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import Clipboard from "../clipboard";
import Launcher from "../launcher";
import Overview from "../overview";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

export const [visible, setVisible] = createState(false);
export const [revealed, setRevealed] = createState(false);
export const [page, setPage] = createState("launcher");

export function getSidebar() {
   return App.instance.get_windows().find((w) => w.name === "sidebar");
}
export function hideSidebar() {
   getSidebar()?.hide();
}
export function showSidebar() {
   getSidebar()?.show();
}
export function toggleSidebar(targetPage: string) {
   const win = getSidebar();
   if (!win) return;

   if (!win.visible) {
      setPage(targetPage);
      showSidebar();
   } else if (targetPage === page()) {
      hideSidebar();
   } else {
      setPage(targetPage);
   }
}

export default function Sidebar() {
   const PAGES = [
      { name: "launcher", Component: Launcher },
      { name: "clipboard", Component: Clipboard },
      { name: "overview", Component: Overview },
   ];
   const { BOTTOM, TOP, LEFT, RIGHT } = Astal.WindowAnchor;
   const { padding } = layout.sidebar;
   let stack: Gtk.Stack;

   function show() {
      setVisible(true);
      setRevealed(true);
   }
   function hide() {
      setRevealed(false);
   }

   const sidebarStyle = style({
      all: "unset",
      "& scrolledwindow": {
         "& viewport": {
            padding: `0 ${padding}px ${padding}px ${padding}px`,
         },
         "& scrollbar.vertical": {
            all: "unset",
            "min-width": "10px",
            "margin-right": "3px",
            "& trough": {
               all: "unset",
            },
            "& slider": {
               all: "unset",
               background: theme.colors.bg[2],
               "min-width": "2px",
               transition: transition.css,
               "transition-property": "min-width, background",
               "&:hover": {
                  "min-width": "4px",
               },
            },
         },
      },
      "& > revealer > .content": {
         background: theme.colors.bg[0],
         "border-left": theme.border.css,
         "& > box > box > .header": {
            background: theme.colors.bg[1],
            "min-height": "55px",
            padding: "0 10px",
            margin: `${padding}px ${padding}px 0 ${padding}px`,
            "& entry": {
               all: "unset",
            },
         },
      },
      "& .calendar": {
         margin: `${padding}px ${padding}px 0 ${padding}px`,
      },
      "& .notifications > .header": {
         margin: ` 0 ${padding}px`,
      },
   });

   return (
      <Astal.Window
         name={"sidebar"}
         namespace={"sidebar"}
         class={sidebarStyle}
         anchor={TOP | BOTTOM | LEFT | RIGHT}
         layer={Astal.Layer.OVERLAY}
         keymode={Astal.Keymode.ON_DEMAND}
         visible={visible}
         application={App.instance}
         ref={(self) => Object.assign(self, { show, hide })}
         onMap={() => stack.grab_focus()}
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
               if (!widget || !stack) return;
               const [, rect] = stack.compute_bounds(widget);
               if (rect.contains_point(new Graphene.Point({ x, y }))) return;
               widget.hide();
            }}
         />
         <Gtk.Revealer
            halign={Gtk.Align.END}
            transitionType={Gtk.RevealerTransitionType.SLIDE_LEFT}
            transitionDuration={transition.duration}
            revealChild={revealed}
            onNotifyChildRevealed={(self) => setVisible(self.childRevealed)}
         >
            <Gtk.Stack
               class={"content"}
               ref={(self) => (stack = self)}
               visibleChildName={page}
               widthRequest={layout.sidebar.size}
               focusable
               vexpand
               hexpand
               transitionType={Gtk.StackTransitionType.SLIDE_UP_DOWN}
               transitionDuration={transition.duration}
               onNotifyVisibleChild={(self) => self.grab_focus()}
            >
               {PAGES.map(({ name, Component }) => (
                  <Gtk.Box slot={"named"} name={name}>
                     <Component />
                  </Gtk.Box>
               ))}
            </Gtk.Stack>
         </Gtk.Revealer>
      </Astal.Window>
   );
}
