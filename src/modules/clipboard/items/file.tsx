import ClipboardService, {
   type ClipboardEntry,
} from "@/src/services/clipboard";
import Gtk from "gi://Gtk?version=4.0";
import Pango from "gi://Pango?version=1.0";
import { computed, createState, effect, For, onCleanup } from "gnim";
import { icons } from "@/src/utils/icons";
import ClipButton from "../clipbutton";

const MAX_FILES = 3;

export default function File({ entry }: { entry: ClipboardEntry }) {
   const clipboard = ClipboardService.get_default();
   const { id } = entry;
   const [paths, setPaths] = createState<string[]>([]);
   const visiblePaths = computed(() => paths().slice(0, MAX_FILES));
   const remaining = computed(() => Math.max(0, paths().length - MAX_FILES));
   const title = computed(() => (visiblePaths().length > 1 ? "Files" : "File"));

   effect(() => {
      let cancelled = false;
      clipboard.getContent(id).then((full) => {
         if (cancelled) return;
         setPaths(clipboard.parseUriList(full));
      });
      onCleanup(() => (cancelled = true));
   });

   return (
      <ClipButton entry={entry} icon={icons.file} title={title}>
         <Gtk.Box orientation={Gtk.Orientation.VERTICAL}>
            <For each={visiblePaths}>
               {(path: string) => (
                  <Gtk.Label
                     hexpand
                     xalign={0}
                     ellipsize={Pango.EllipsizeMode.MIDDLE}
                     label={path}
                  />
               )}
            </For>
            <Gtk.Label
               visible={remaining.as((n) => n > 0)}
               xalign={0}
               label="..."
            />
         </Gtk.Box>
      </ClipButton>
   );
}
