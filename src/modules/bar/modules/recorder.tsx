import RecorderService from "@/src/services/recorder";
import { bind } from "gnim";
import { BarButton } from "@/src/widgets/barbutton";
import Gtk from "gi://Gtk?version=4.0";
import { icons } from "@/src/utils/icons";
import { theme } from "@/src/config";
import { keyframes, style } from "@gnim-js/gtk4";

export default function Recorder() {
   const recorder = RecorderService.get_default();
   const timer = bind(recorder, "timer");
   const recording = bind(recorder, "recording");

   const blink = keyframes({
      from: { color: theme.colors.fg[0] },
      to: { color: theme.colors.red },
   });

   const recorderStyle = style({
      "&.active .content": {
         animation: `${blink} 1s ease-in-out infinite alternate`,
      },
   });

   return (
      <BarButton
         class={recorderStyle}
         active={recording}
         onClicked={() =>
            recorder.recording ? recorder.stop() : recorder.start()
         }
      >
         <Gtk.Image iconName={icons.video} pixelSize={20} />
      </BarButton>
   );
}
