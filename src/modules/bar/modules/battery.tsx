import AstalBattery from "gi://AstalBattery?version=0.1";
import { bind, computed } from "gnim";
import Gtk from "gi://Gtk?version=4.0";
import { bash } from "@/src/utils";
import { getBatteryIcon } from "@/src/utils/icons";
import { BarButton } from "@/src/widgets/barbutton";

export default function Battery() {
   const battery = AstalBattery.get_default();
   const percentage = bind(battery, "percentage");
   const state = bind(battery, "state");

   return (
      <BarButton
         class={"battery"}
         onClicked={() => {
            bash("XDG_CURRENT_DESKTOP=gnome gnome-control-center power");
         }}
      >
         <Gtk.Image
            iconName={computed(() => getBatteryIcon(percentage(), state()))}
            pixelSize={20}
            hexpand
         />
      </BarButton>
   );
}
