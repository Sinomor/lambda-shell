import { render } from "@gnim-js/gtk4";
import Gdk from "gi://Gdk?version=4.0";
import Gio from "gi://Gio?version=2.0";
import GLib from "gi://GLib?version=2.0";
import Gtk from "gi://Gtk?version=4.0";
import { For } from "gnim";
import { register, signal } from "gnim/gobject";
import { exit, programArgs, programInvocationName } from "system";
import Bar, { barControls } from "./modules/bar";
import Sidebar, { toggleSidebar } from "./modules/sidebar";
import OSD from "./modules/osd";
import NotificationPopups from "./modules/notifications";
import Powermenu, { togglePowermenu } from "./modules/powermenu";
import GObject from "gi://GObject?version=2.0";
import { config } from "./config";

export namespace App {
   export interface SignalSignatures extends Gtk.Application.SignalSignatures {
      "window-toggled": App["windowToggled"];
   }
}

@register
export class App extends Gtk.Application {
   declare $signals: App.SignalSignatures;

   @signal([Gtk.Window], GObject.VoidType)
   windowToggled(win: Gtk.Window): void {}

   static instance: App;

   constructor() {
      super({
         applicationId: config.app.id,
         resourceBasePath: `/${config.app.id.replaceAll(".", "/")}/`,
         flags: Gio.ApplicationFlags.HANDLES_COMMAND_LINE,
      });
   }

   override vfunc_command_line(
      this: App,
      cmd: Gio.ApplicationCommandLine,
   ): number {
      const args = cmd.get_arguments();
      const argv = args.slice(1);

      if (cmd.isRemote) {
         this.handleCommand(argv, cmd);
      } else {
         this.main(argv);
         this.handleCommand(argv, cmd);
      }

      cmd.done();
      return 0;
   }

   private handleCommand(argv: string[], cmd?: Gio.ApplicationCommandLine) {
      if (argv.length === 0) return;

      const [command, ...rest] = argv;

      switch (command) {
         case "sidebar": {
            const page = rest[0];
            if (!page) {
               if (cmd) cmd.print_literal("Error: Missing window name\n");
               return;
            }
            toggleSidebar(page);
            break;
         }
         case "inspect": {
            Gtk.Window.set_interactive_debugging(true);
            break;
         }
         case "focus": {
            barControls.enterFocusMode();
            break;
         }
         case "powermenu": {
            togglePowermenu();
            break;
         }
         case "quit": {
            this.quit();
            exit(0);
            break;
         }
         default:
            console.log(`Unknown command: ${command}`);
            break;
      }
   }

   protected main(this: App, args: string[]) {
      this.connect("window-added", (_, win) => {
         win.connect("notify::visible", () => this.windowToggled(win));
      });
      const monitors = Gdk.Display.get_default()!.get_monitors();

      const dispose = render(
         () => (
            <For each={monitors}>
               {(monitor: Gdk.Monitor) => (
                  <>
                     <Bar />
                     <Sidebar />
                     <NotificationPopups />
                     <OSD />
                     <Powermenu />
                  </>
               )}
            </For>
         ),
         this,
      );

      this.connect("shutdown", dispose);
   }
}

/* main */ {
   GLib.set_prgname(config.app.name);

   GLib.setenv("LD_PRELOAD", "", true);

   App.instance = new App();
   App.instance
      .runAsync([programInvocationName, ...programArgs])
      .catch(console.error);
}
