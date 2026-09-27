import { icons } from "@/src/utils/icons";
import AstalBluetooth from "gi://AstalBluetooth?version=0.1";
import { bind, computed } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import { bash } from "@/src/utils";
import Gtk from "gi://Gtk?version=4.0";

export default function Bluetooth({
   ref,
}: {
   ref: (self: Gtk.Button) => void;
}) {
   const bluetooth = AstalBluetooth.get_default();
   const powered = bind(bluetooth, "is-powered");
   const connected = bind(bluetooth, "is-connected");
   const icon = icons.bluetooth;

   return (
      <BarButton
         class={"bluetooth"}
         onClicked={() => {
            bash(`XDG_CURRENT_DESKTOP=gnome gnome-control-center bluetooth`);
         }}
         ref={ref}
      >
         <Gtk.Image
            iconName={computed(() =>
               powered() ? (connected() ? icon.connected : icon.on) : icon.off,
            )}
            pixelSize={20}
            hexpand
         />
      </BarButton>
   );
}
