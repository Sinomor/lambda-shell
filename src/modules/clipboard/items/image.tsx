import ClipboardService, {
   type ClipboardEntry,
} from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import Adw from "gi://Adw?version=1";
import { icons } from "@/src/utils/icons";
import ClipButton from "../clipbutton";
import { layout } from "@/src/config";

export default function Image({ entry }: { entry: ClipboardEntry }) {
   const clipboard = ClipboardService.get_default();
   const { id, image } = entry;
   const maxSize = layout.sidebar.size - layout.sidebar.padding * 2 - 10 * 2;

   const maxWidth = maxSize;
   let heightPx = maxSize;
   if (image) {
      const widthPx = (image.width / image.height) * maxSize;
      heightPx = widthPx > maxWidth ? (maxSize / widthPx) * maxWidth : maxSize;
   }

   return (
      <ClipButton entry={entry} icon={icons.image} title={"Image"}>
         <Adw.Clamp
            orientation={Gtk.Orientation.VERTICAL}
            maximumSize={heightPx}
         >
            <Gtk.Picture
               halign={Gtk.Align.START}
               heightRequest={heightPx}
               ref={async (self) => {
                  const path = await clipboard.loadImage(id);
                  if (path) self.set_file(Gio.file_new_for_path(path));
               }}
            />
         </Adw.Clamp>
      </ClipButton>
   );
}
