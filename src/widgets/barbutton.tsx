import { style } from "@gnim-js/gtk4";
import Gdk from "gi://Gdk?version=4.0";
import GObject from "gi://GObject?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { computed, type GnimNode, MaybeAccessor, isAccessor } from "gnim";
import { layout } from "../config";

export type BarItemProps = Partial<GObject.ConstructorProps<Gtk.Button>> & {
   children?: GnimNode;
   active?: MaybeAccessor<boolean>;
   onClicked?: (ctrl?: Gtk.GestureClick, x?: number, y?: number) => void;
   onSecondaryClicked?: (
      ctrl?: Gtk.GestureClick,
      x?: number,
      y?: number,
   ) => void;
   onMiddleClicked?: (ctrl?: Gtk.GestureClick, x?: number, y?: number) => void;
   class?: string | string[];
   spacing?: number;
   ref?: (self: Gtk.Button) => void;
};

export function BarButton({
   children,
   active,
   onClicked,
   onSecondaryClicked,
   onMiddleClicked,
   class: extraClass,
   spacing,
   ref,
   ...props
}: BarItemProps) {
   const classes = computed(() => {
      const result = ["barbutton"];
      if (extraClass) {
         Array.isArray(extraClass)
            ? result.push(...extraClass)
            : result.push(extraClass);
      }

      const isActive = isAccessor(active) ? active() : active;
      if (isActive) result.push("active");

      return result;
   });

   return (
      <Gtk.Button class={classes} ref={ref} focusOnClick={false} {...props}>
         <Gtk.EventControllerKey
            onKeyPressed={(_, keyval) => {
               if (keyval === Gdk.KEY_Return) {
                  onClicked?.();
                  return true;
               }
               return false;
            }}
         />
         <Gtk.GestureClick
            onPressed={(ctrl, _, x, y) => {
               const button = ctrl.get_current_button();
               ctrl.set_state(Gtk.EventSequenceState.CLAIMED);
               if (button === Gdk.BUTTON_PRIMARY) {
                  onClicked?.(ctrl, x, y);
               } else if (button === Gdk.BUTTON_SECONDARY) {
                  onSecondaryClicked?.(ctrl, x, y);
               } else if (button === Gdk.BUTTON_MIDDLE) {
                  onMiddleClicked?.(ctrl, x, y);
               }
            }}
            button={0}
         />
         <Gtk.Box
            class={"content"}
            orientation={Gtk.Orientation.VERTICAL}
            spacing={spacing ?? layout.bar.spacing}
            hexpand
         >
            {children}
         </Gtk.Box>
      </Gtk.Button>
   );
}
