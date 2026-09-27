import { icons } from "@/src/utils/icons";
import { BarButton } from "@/src/widgets/barbutton";
import Gtk from "gi://Gtk?version=4.0";
import { page, toggleSidebar, visible } from "../../sidebar";
import { computed } from "gnim";

export default function Launcher() {
   return (
      <BarButton
         active={computed(() => visible() && page() === "launcher")}
         onClicked={() => toggleSidebar("launcher")}
      >
         <Gtk.Image iconName={icons.rocket} pixelSize={20} />
      </BarButton>
   );
}
