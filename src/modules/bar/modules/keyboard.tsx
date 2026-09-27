import { bind, connectSignal, createState } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import Gtk from "gi://Gtk?version=4.0";
import AstalNiri from "gi://AstalNiri?version=0.2";
import { bash } from "@/src/utils";

export default function Keyboard() {
   const niri = AstalNiri.get_default();
   const [layout, setLayout] = createState("?");

   async function updateLayout() {
      const json = JSON.parse(await bash("niri msg --json keyboard-layouts"));
      const layouts = json.names;
      const layout = layouts[json.current_idx];
      switch (layout) {
         case "Russian":
            setLayout("Ru");
            break;
         case "English (US)":
            setLayout("En");
            break;
         default:
            setLayout("?");
            break;
      }
   }
   updateLayout();
   connectSignal(niri, "keyboard-layout-switched", () => updateLayout());

   return (
      <BarButton
         class={"kblayout"}
         onClicked={() => AstalNiri.Message.switch_layout_next()}
      >
         <Gtk.Label label={layout} hexpand />
      </BarButton>
   );
}
