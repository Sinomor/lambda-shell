import Gtk from "gi://Gtk?version=4.0";
import { Calendar } from "./calendar";
import Notifications from "./notifications";
import { layout } from "@/src/config";

export default function Overview() {
   return (
      <Gtk.Box
         class={"overview"}
         orientation={Gtk.Orientation.VERTICAL}
         spacing={layout.sidebar.padding}
      >
         <Calendar />
         <Notifications />
      </Gtk.Box>
   );
}
