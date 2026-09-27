import AstalNetwork from "gi://AstalNetwork?version=0.1";
import { BarButton } from "@/src/widgets/barbutton";
import { bash } from "@/src/utils";
import { bind, computed } from "gnim";
import Gtk from "gi://Gtk?version=4.0";
import { getWifiIcon, icons } from "@/src/utils/icons";

export default function Network() {
   const network = AstalNetwork.get_default();
   const primary = bind(network, "primary");
   const wifi = network.wifi;
   const connectivity = bind(network, "connectivity");
   const strength = bind(wifi, "strength");
   const internet = bind(wifi, "internet");
   const enabled = bind(wifi, "enabled");

   return (
      <BarButton
         class={"network"}
         onClicked={() => {
            bash(
               `XDG_CURRENT_DESKTOP=gnome gnome-control-center ${
                  network.primary === AstalNetwork.Primary.WIRED
                     ? "network"
                     : "wifi"
               }`,
            );
         }}
      >
         <Gtk.Image
            iconName={computed(() => {
               if (primary() === AstalNetwork.Primary.WIRED)
                  return icons.network.wired;
               if (primary() === AstalNetwork.Primary.WIFI)
                  return getWifiIcon(
                     strength(),
                     internet(),
                     connectivity(),
                     enabled(),
                  );
               return icons.network.wifi.full;
            })}
            pixelSize={20}
            hexpand
         />
      </BarButton>
   );
}
