import { createPoll } from "@gnim-js/io/timer";
import GLib from "gi://GLib?version=2.0";
import { computed, connectSignal, createState, effect, With } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import Gtk from "gi://Gtk?version=4.0";
import { page, toggleSidebar, visible } from "../../sidebar";
import { App } from "@/src/main";

export default function Clock() {
   const time = createPoll("", 1000, () =>
      GLib.DateTime.new_now_local()!.format("%H %M")!,
   );
   const [isVisible, setIsVisible] = createState(false);
   const [isActive, setIsActive] = createState(false);
   connectSignal(App.instance, "window-toggled", (win) => {
      if (win.name === "sidebar") setIsVisible(win.visible);
   });
   effect(() => {
      setIsActive(isVisible() && page() === "overview");
   });

   return (
      <BarButton
         class={"clock"}
         active={isActive}
         onClicked={() => toggleSidebar("overview")}
         spacing={0}
      >
         <With value={time}>
            {(time) =>
               time.split(" ").map((part) => <Gtk.Label label={part} />)
            }
         </With>
      </BarButton>
   );
}
