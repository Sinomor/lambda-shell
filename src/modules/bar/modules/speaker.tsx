import AstalWp from "gi://AstalWp?version=0.1";
import { bind, computed, For } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import Gtk from "gi://Gtk?version=4.0";
import { attachHoverScroll, bash } from "@/src/utils";
import { getSpeakerIcon } from "@/src/utils/icons";

export default function Speaker() {
   const wp = AstalWp.get_default();
   const speaker = wp.audio.defaultSpeaker;
   const volume = bind(speaker, "volume");
   const mute = bind(speaker, "mute");
   const desc = bind(speaker, "description");

   return (
      <BarButton
         class={"speaker"}
         onClicked={() => {
            bash(`XDG_CURRENT_DESKTOP=gnome gnome-control-center sound`);
         }}
         ref={(self) =>
            attachHoverScroll(self, ({ dy }) => {
               if (dy < 0) speaker.set_volume(speaker.volume + 0.01);
               else if (dy > 0) speaker.set_volume(speaker.volume - 0.01);
            })
         }
      >
         <Gtk.Image
            iconName={computed(() => getSpeakerIcon(volume(), mute(), desc()!))}
            pixelSize={20}
            hexpand
         />
      </BarButton>
   );
}
