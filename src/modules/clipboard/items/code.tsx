import ClipboardService, {
   type ClipboardEntry,
} from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { createState, effect, onCleanup } from "gnim";
import { icons } from "@/src/utils/icons";
import { truncateLines } from "@/src/utils";
import ClipButton from "../clipbutton";
import { style } from "@gnim-js/gtk4";

export default function Code({ entry }: { entry: ClipboardEntry }) {
   const clipboard = ClipboardService.get_default();
   const { id, languageId, preview } = entry;
   const [markup, setMarkup] = createState<string | null>(null);

   effect(() => {
      let cancelled = false;
      clipboard.getContent(id).then((full) => {
         if (cancelled) return;
         setMarkup(
            languageId ? clipboard.highlightMarkup(full, languageId) : full,
         );
      });
      onCleanup(() => (cancelled = true));
   });

   return (
      <ClipButton entry={entry} icon={icons["code-xml"]} title={"Code"}>
         <Gtk.Label
            useMarkup
            wrap={false}
            xalign={0}
            ellipsize={Pango.EllipsizeMode.END}
            label={markup.as((m) => m ?? preview)}
            hexpand
         />
      </ClipButton>
   );
}
