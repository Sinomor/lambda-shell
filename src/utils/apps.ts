import AstalApps from "gi://AstalApps?version=0.1";
const apps = new AstalApps.Apps({ showHidden: true });

const appInfoCache = new Map<string, AstalApps.Application | null>();
const MAX_CACHE_SIZE = 50;

function addToCache(key: string, value: AstalApps.Application | null): void {
   if (appInfoCache.size >= MAX_CACHE_SIZE) {
      const firstKey = appInfoCache.keys().next().value;
      if (firstKey) appInfoCache.delete(firstKey);
   }
   appInfoCache.set(key, value);
}

function findApp(
   appId: string,
   appList: AstalApps.Application[],
): AstalApps.Application | null {
   for (const app of appList) {
      if (
         app.entry.toLowerCase() === appId.toLowerCase() ||
         app.entry
            .split(".desktop")[0]
            .toLowerCase()
            .match(appId.toLowerCase()) ||
         app.iconName === appId ||
         app.name === appId ||
         app.wmClass === appId
      ) {
         return app;
      }
   }

   return null;
}

export function getApp(appId: string) {
   if (!appId) return null;

   if (appInfoCache.has(appId)) {
      return appInfoCache.get(appId);
   }

   apps.reload();
   const appList = apps.get_list();
   const match = findApp(appId, appList);
   addToCache(appId, match);
   return match;
}
