import ClipboardService, {
   type ClipboardEntry,
} from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { createState, effect, onCleanup } from "gnim";
import { icons } from "@/src/utils/icons";
import { truncateLines } from "@/src/utils";
import ClipButton from "../clipbutton";

export default function Text({ entry }: { entry: ClipboardEntry }) {
   const clipboard = ClipboardService.get_default();
   const MAX_LINES = 3;
   const { id, preview } = entry;

   return (
      <ClipButton entry={entry} icon={icons["file-text"]} title={"Text"}>
         <Gtk.Label
            wrap
            wrapMode={Pango.WrapMode.CHAR}
            xalign={0}
            justify={Gtk.Justification.FILL}
            ellipsize={Pango.EllipsizeMode.END}
            lines={MAX_LINES}
            label={truncateLines(entry.preview, MAX_LINES)}
            hexpand
         />
      </ClipButton>
   );
}
