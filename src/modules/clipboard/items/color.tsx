import { type ClipboardEntry } from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { icons } from "@/src/utils/icons";
import ClipButton from "../clipbutton";
import { layout } from "@/src/config";

export default function Color({ entry }: { entry: ClipboardEntry }) {
   const { preview } = entry;

   return (
      <ClipButton entry={entry} icon={icons.pipette} title={"Color"}>
         <Gtk.Box
            orientation={Gtk.Orientation.VERTICAL}
            spacing={layout.spacing}
         >
            <Gtk.Box
               heightRequest={50}
               css={`
                  background: ${preview};
               `}
            />
            <Gtk.Label
               hexpand
               ellipsize={Pango.EllipsizeMode.END}
               xalign={0}
               label={preview}
            />
         </Gtk.Box>
      </ClipButton>
   );
}
