import AstalWp from "gi://AstalWp?version=0.1";
import Gtk from "gi://Gtk?version=4.0";
import { connectSignal, createState } from "gnim";
import { timeout } from "@gnim-js/io/timer";
import { App } from "@/src/main";
import cairo from "gi://cairo?version=1.0";
import { icons, getSpeakerIcon } from "@/src/utils/icons";
import AstalNiri from "gi://AstalNiri?version=0.2";
import { bash } from "@/src/utils";
import Astal from "gi://Astal?version=4.0";
import { style } from "@gnim-js/gtk4";
import { behavior, layout, theme, transition } from "@/src/config";
import AstalBrightness from "gi://AstalBrightness?version=0.1";

export default function OSD() {
   const { BOTTOM, TOP, LEFT, RIGHT } = Astal.WindowAnchor;
   const wp = AstalWp.get_default();
   const niri = AstalNiri.get_default();
   const speaker = wp.audio.defaultSpeaker;
   const brightness = AstalBrightness.get_default();
   const [visible, setVisible] = createState(false);
   const [revealed, setRevealed] = createState(false);
   const [icon, setIcon] = createState("");
   const [text, setText] = createState("");
   let count = 0;
   let firstStart = true;

   function show(text: string, icon: string) {
      setVisible(true);
      setRevealed(true);
      setText(text);
      setIcon(icon);
      count++;

      timeout(behavior.osd.timeout, () => {
         count--;
         if (count === 0) {
            setRevealed(false);
         }
      });
   }

   connectSignal(speaker, "notify::volume", () => {
      if (firstStart) return;
      show(
         `${Math.floor(speaker.volume * 100)}%`,
         getSpeakerIcon(speaker.volume, speaker.mute, speaker.description!),
      );
   });
   connectSignal(speaker, "notify::mute", () => {
      if (firstStart) return;
      show(
         `${Math.floor(speaker.volume * 100)}%`,
         getSpeakerIcon(speaker.volume, speaker.mute, speaker.description!),
      );
   });
   // connectSignal(niri, "keyboard-layout-switched", async () => {
   //    if (firstStart) return;
   //    const json = JSON.parse(await bash("niri msg --json keyboard-layouts"));
   //    const layouts = json.names;
   //    const layout = layouts[json.current_idx];
   //    show(layout, icons.keyboard);
   // });
   timeout(1000, () => (firstStart = false));

   const osdStyle = style({
      background: theme.colors.bg[0],
      padding: "15px",
      border: theme.border.css,
      margin: `0 15px 15px 15px`,
   });

   return (
      <Astal.Window
         name={"osd"}
         namespace={"osd"}
         class={style({ all: "unset" })}
         anchor={BOTTOM}
         layer={Astal.Layer.OVERLAY}
         keymode={Astal.Keymode.NONE}
         visible={visible}
         defaultHeight={1}
         defaultWidth={1}
         application={App.instance}
         onNotifyVisible={(self) => {
            if (self.visible)
               self
                  .get_native()
                  ?.get_surface()
                  ?.set_input_region(new cairo.Region());
         }}
      >
         <Gtk.Revealer
            transitionType={Gtk.RevealerTransitionType.SLIDE_UP}
            transitionDuration={transition.duration}
            revealChild={revealed}
            onNotifyChildRevealed={({ childRevealed }) =>
               setVisible(childRevealed)
            }
         >
            <Gtk.Box spacing={layout.spacing} class={osdStyle}>
               <Gtk.Image iconName={icon} pixelSize={20} />
               <Gtk.Label label={text} />
            </Gtk.Box>
         </Gtk.Revealer>
      </Astal.Window>
   );
}
