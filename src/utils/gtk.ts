import Gdk from "gi://Gdk?version=4.0";
import Gtk from "gi://Gtk?version=4.0";

interface ScrollInfo {
   dx: number;
   dy: number;
   hovered: boolean;
   shift: boolean;
}

type ScrollHandler = (info: ScrollInfo) => void;

export function attachHoverScroll(
   box: Gtk.Box | Gtk.Button,
   onScroll: ScrollHandler,
): void {
   let hovered = false;

   const motion = new Gtk.EventControllerMotion();
   motion.connect("enter", () => (hovered = true));
   motion.connect("leave", () => (hovered = false));
   box.add_controller(motion);

   const scrollCtrl = new Gtk.EventControllerScroll({
      flags:
         Gtk.EventControllerScrollFlags.VERTICAL |
         Gtk.EventControllerScrollFlags.DISCRETE,
   });

   scrollCtrl.connect("scroll", (_ctrl, dx, dy) => {
      if (!hovered) return Gdk.EVENT_PROPAGATE;

      const state = _ctrl.get_current_event_state?.() ?? 0;
      const shift = (state & Gdk.ModifierType.SHIFT_MASK) !== 0;

      onScroll({ dx, dy, hovered, shift });

      return Gdk.EVENT_STOP;
   });

   scrollCtrl.set_propagation_phase(Gtk.PropagationPhase.BUBBLE);
   box.add_controller(scrollCtrl);
}

export function isIcon(icon?: string | null): boolean {
   return !!icon && getIconTheme().has_icon(icon);
}

let iconThemeCache: Gtk.IconTheme | null = null;

function getIconTheme(): Gtk.IconTheme {
   if (!iconThemeCache) {
      iconThemeCache = Gtk.IconTheme.get_for_display(
         Gdk.Display.get_default()!,
      );
   }
   return iconThemeCache;
}
