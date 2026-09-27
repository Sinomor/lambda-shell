import AstalBattery from "gi://AstalBattery?version=0.1";
import AstalNetwork from "gi://AstalNetwork?version=0.1";
import AstalWp from "gi://AstalWp?version=0.1";

export const icons = {
   rocket: "ls-rocket-symbolic",
   "code-xml": "ls-code-xml-symbolic",
   "file-text": "ls-file-text-symbolic",
   file: "ls-file-symbolic",
   pipette: "ls-pipette-symbolic",
   image: "ls-image-symbolic",
   trash: "ls-trash-symbolic",
   "app-default": "application-x-executable",
   video: "ls-video-symbolic",
   keyboard: "ls-keyboard-symbolic",
   close: "ls-x-symbolic",
   battery: {
      charging: "ls-battery-charging-symbolic",
      plus: "ls-battery-plus-symbolic",
      void: "ls-battery-symbolic",
      low: "ls-battery-low-symbolic",
      medium: "ls-battery-medium-symbolic",
      full: "ls-battery-full-symbolic",
   },
   chevron: {
      left: "ls-chevron-left-symbolic",
      right: "ls-chevron-right-symbolic",
      up: "ls-chevron-up-symbolic",
      down: "ls-chevron-down-symbolic",
   },
   volume: {
      muted: "ls-volume-x-symbolic",
      low: "ls-volume-symbolic",
      medium: "ls-volume-1-symbolic",
      high: "ls-volume-2-symbolic",
   },
   network: {
      wifi: {
         off: "ls-wifi-off-symbolic",
         zero: "ls-wifi-zero-symbolic",
         low: "ls-wifi-low-symbolic",
         high: "ls-wifi-high-symbolic",
         full: "ls-wifi-symbolic",
      },
      wired: "ls-network-symbolic",
   },
   bluetooth: {
      on: "ls-bluetooth-symbolic",
      off: "ls-bluetooth-off-symbolic",
      connected: "ls-bluetooth-connected-symbolic",
   },
   bell: {
      normal: "ls-bell-symbolic",
      off: "ls-bell-off-symbolic",
      dot: "ls-bell-dot-symbolic",
   },
   powermenu: {
      sleep: "ls-moon-symbolic",
      reboot: "ls-refresh-cw-symbolic",
      logout: "ls-log-out-symbolic",
      shutdown: "ls-power-symbolic",
   },
};

export function getSpeakerIcon(volume: number, mute: boolean, desc: string) {
   if (volume === 0 || mute) {
      return icons.volume.muted;
   } else if (volume < 0.33) {
      return icons.volume.low;
   } else if (volume < 0.66) {
      return icons.volume.medium;
   } else {
      return icons.volume.high;
   }
}

export function getBatteryIcon(percentage: number, state: AstalBattery.State) {
   if (state === AstalBattery.State.CHARGING) return icons.battery.charging;
   if (percentage <= 0.25) return icons.battery.void;
   if (percentage <= 0.5) return icons.battery.low;
   if (percentage <= 0.75) return icons.battery.medium;
   return icons.battery.full;
}

export function getWifiIcon(
   strength: number,
   internet: AstalNetwork.Internet,
   connectivity: AstalNetwork.Connectivity,
   enabled: boolean,
) {
   if (!enabled || connectivity === AstalNetwork.Connectivity.NONE) {
      return icons.network.wifi.off;
   }

   if (strength < 26) {
      return icons.network.wifi.zero;
   } else if (strength < 51) {
      return icons.network.wifi.low;
   } else if (strength < 76) {
      return icons.network.wifi.high;
   } else {
      return icons.network.wifi.full;
   }

   return icons.network.wifi.full;
}
