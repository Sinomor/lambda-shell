import Gtk from "gi://Gtk?version=4.0";
import AstalNotifd from "gi://AstalNotifd?version=0.1";
import {
   bind,
   computed,
   connectSignal,
   createState,
   effect,
   For,
   onCleanup,
} from "gnim";
import { Notification } from "./notification";
import { App } from "@/src/main";
import Gls from "gi://Gtk4LayerShell?version=1.0";
import giCairo from "gi://cairo?version=1.0";
import { timeout, Timer } from "@gnim-js/io/timer";
import Astal from "gi://Astal?version=4.0";
import { style } from "@gnim-js/gtk4";
import { behavior, layout, transition } from "@/src/config";

export default function NotificationPopups() {
   const { BOTTOM, TOP, LEFT, RIGHT } = Astal.WindowAnchor;
   const notifd = AstalNotifd.get_default();
   const dnd = bind(notifd, "dont-disturb");
   const [popups, setPopups] = createState<AstalNotifd.Notification[]>([]);
   let win: Astal.Window;
   let box: Gtk.Box;

   connectSignal(notifd, "notified", (id, replaced) => {
      if (dnd.peek()) return;
      const n = notifd.get_notification(id);
      if (!n) return;
      setPopups((prev) =>
         replaced ? prev.map((p) => (p.id === id ? n : p)) : [n, ...prev],
      );
      timeout(100, () => {
         const [ok, bounds] = box.compute_bounds(win);
         const region = new giCairo.Region();
         if (ok && popups().length > 0) {
            // @ts-expect-error
            region.unionRectangle(
               new giCairo.Rectangle({
                  x: bounds.get_x(),
                  y: bounds.get_y(),
                  width: bounds.get_width(),
                  height: bounds.get_height(),
               }),
            );
         }
         win.get_native()?.get_surface()?.set_input_region(region);
      });
   });

   const notificationsStyle = style({
      all: "unset",
      "& revealer:first-child .notification": {
         "margin-top": "15px",
      },
      "& .notification": {
         "margin-right": "15px",
      },
   });

   return (
      <Astal.Window
         name={"notifications"}
         namespace={"notifications"}
         class={notificationsStyle}
         anchor={TOP | RIGHT}
         layer={Astal.Layer.OVERLAY}
         keymode={Astal.Keymode.NONE}
         application={App.instance}
         visible={computed(() => !dnd() && popups().length > 0)}
         ref={(self) => (win = self)}
      >
         <Gtk.Box
            ref={(self) => (box = self)}
            orientation={Gtk.Orientation.VERTICAL}
            spacing={layout.spacing}
         >
            <For each={popups}>
               {(n: AstalNotifd.Notification) => {
                  const [revealed, setRevealed] = createState(false);
                  let timer: Timer | null = null;
                  let remaining = behavior.notifications.timeout;
                  let startedAt = 0;

                  function startTimer() {
                     startedAt = Date.now();
                     timer = timeout(remaining, () => {
                        setRevealed(false);
                        timer = null;
                     });
                  }

                  function pauseTimer() {
                     if (timer !== null) {
                        remaining -= Date.now() - startedAt;
                        timer.cancel();
                        timer = null;
                     }
                  }

                  function cancelTimer() {
                     timer?.cancel();
                     timer = null;
                  }

                  connectSignal(notifd, "resolved", (id: number) => {
                     if (id === n.id) {
                        cancelTimer();
                        setRevealed(false);
                     }
                  });

                  onCleanup(cancelTimer);

                  timeout(0, () => {
                     setRevealed(true);
                     startTimer();
                  });

                  return (
                     <Gtk.Revealer
                        revealChild={revealed}
                        transitionType={Gtk.RevealerTransitionType.SLIDE_DOWN}
                        transitionDuration={transition.duration}
                        onNotifyChildRevealed={(self) => {
                           if (!self.childRevealed)
                              setPopups((prev) =>
                                 prev.filter((p) => p.id !== n.id),
                              );
                        }}
                     >
                        <Gtk.EventControllerMotion
                           onEnter={pauseTimer}
                           onLeave={() => {
                              if (revealed.peek()) startTimer();
                           }}
                        />
                        <Notification
                           n={n}
                           showActions
                           onClose={() => {
                              cancelTimer();
                              setRevealed(false);
                              n.dismiss();
                           }}
                        />
                     </Gtk.Revealer>
                  );
               }}
            </For>
         </Gtk.Box>
      </Astal.Window>
   );
}
