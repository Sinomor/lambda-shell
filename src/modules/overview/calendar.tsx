import { bind, For, type Accessor } from "gnim";
import Gtk from "gi://Gtk?version=4.0";
import { icons } from "@/src/utils/icons";
import { CalendarService, CalendarDay } from "@/src/services/calendar";
import { Grid, GridChild } from "@/src/widgets/grid";
import { style } from "@gnim-js/gtk4";
import { layout, theme, transition } from "@/src/config";

function Day({ day }: { day: CalendarDay }) {
   const classes = ["day"];

   if (day.isToday) classes.push("today");
   else if (day.isWeekend && day.isOtherMonth)
      classes.push("other-month-weekend");
   else if (day.isOtherMonth) classes.push("other-month");
   else if (day.isWeekend) classes.push("weekend");

   return (
      <Gtk.Label
         class={classes}
         halign={Gtk.Align.CENTER}
         label={day.day.toString()}
      />
   );
}

function Weekday({ day, col }: { day: string; col: number }) {
   const isWeekend = col >= 5;
   return (
      <Gtk.Label
         class={["day", "weekday", isWeekend ? "weekend" : ""]}
         halign={Gtk.Align.CENTER}
         label={day}
      />
   );
}

export function Calendar() {
   const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];
   const calendar = CalendarService.get_default();
   const days = bind(calendar, "calendar");

   const label = bind(calendar, "date").as((date: Date) =>
      date.toLocaleString("default", { month: "long", year: "numeric" }),
   );

   const calendarStyle = style({
      background: theme.colors.bg[1],
      padding: "10px",
      "& .header": {
         "& label": {
            padding: "0 10px",
         },
      },
      "& .days": {},
      "& .day": {
         "min-height": "35px",
         "min-width": "35px",
      },
      "& .today": {
         background: theme.colors.accent,
      },
      "& .weekend": {
         color: theme.colors.red,
      },
      "& .other-month": {
         color: theme.colors.fg[2],
      },
      "& .other-month-weekend": {
         color: theme.colors.redDark,
      },
      "& button": {
         all: "unset",
         "min-height": "35px",
         "min-width": "35px",
         transition: transition.css,
         "transition-property": "background",
         "&:hover": {
            background: theme.colors.bg[2],
         },
         "&:focus": {
            "outline-offset": `-${theme.outline.width}px`,
            outline: theme.outline.css,
         },
      },
   });

   return (
      <Gtk.Box
         class={[calendarStyle, "calendar"]}
         ref={(self) => {
            self.connect("map", () => calendar.reset());
         }}
         orientation={Gtk.Orientation.VERTICAL}
         spacing={layout.spacing}
      >
         <Gtk.Box spacing={layout.spacing} class={"header"}>
            <Gtk.Button
               focusOnClick={false}
               onClicked={() => calendar.shiftMonth(-1)}
            >
               <Gtk.Image iconName={icons.chevron.left} pixelSize={20} />
            </Gtk.Button>
            <Gtk.Button
               onClicked={() => calendar.reset()}
               focusOnClick={false}
               label={label}
               halign={Gtk.Align.CENTER}
               hexpand
            />
            <Gtk.Button
               focusOnClick={false}
               onClicked={() => calendar.shiftMonth(1)}
            >
               <Gtk.Image iconName={icons.chevron.right} pixelSize={20} />
            </Gtk.Button>
         </Gtk.Box>
         <Grid
            class="days"
            rowSpacing={layout.spacing}
            columnSpacing={layout.spacing}
         >
            {WEEKDAYS.map((day, col) => (
               <GridChild col={col} row={0}>
                  <Weekday day={day} col={col} />
               </GridChild>
            ))}
            <For each={days}>
               {(day: CalendarDay, index: Accessor<number>) => (
                  <GridChild
                     col={index.as((i) => i % 7)}
                     row={index.as((i) => Math.floor(i / 7) + 1)}
                  >
                     <Day day={day} />
                  </GridChild>
               )}
            </For>
         </Grid>
      </Gtk.Box>
   );
}
