// Sensors and wearables a student can name. Picking one tells ScarletWell what the device can report (a glucose reading,
// sleep, steps, heart rate) and which nudges can fire. Nothing is read from a device until the student connects or exports it.
export type DeviceKind = "cgm" | "glucometer" | "watch" | "ring" | "band" | "scale" | "bp";
export interface Device { name: string; maker: string; kind: DeviceKind; gives: ("glucose" | "sleep" | "steps" | "heart_rate" | "hrv" | "spo2" | "weight" | "blood_pressure" | "skin_temp")[] }

export const DEVICES: Device[] = [
  { name: "Dexcom G7", maker: "Dexcom", kind: "cgm", gives: ["glucose"] },
  { name: "Dexcom G6", maker: "Dexcom", kind: "cgm", gives: ["glucose"] },
  { name: "Dexcom Stelo", maker: "Dexcom", kind: "cgm", gives: ["glucose"] },
  { name: "FreeStyle Libre 3 Plus", maker: "Abbott", kind: "cgm", gives: ["glucose"] },
  { name: "FreeStyle Libre 3", maker: "Abbott", kind: "cgm", gives: ["glucose"] },
  { name: "FreeStyle Libre 2 Plus", maker: "Abbott", kind: "cgm", gives: ["glucose"] },
  { name: "FreeStyle Libre 2", maker: "Abbott", kind: "cgm", gives: ["glucose"] },
  { name: "Lingo", maker: "Abbott", kind: "cgm", gives: ["glucose"] },
  { name: "Guardian 4", maker: "Medtronic", kind: "cgm", gives: ["glucose"] },
  { name: "Simplera", maker: "Medtronic", kind: "cgm", gives: ["glucose"] },
  { name: "Eversense 365", maker: "Senseonics", kind: "cgm", gives: ["glucose"] },
  { name: "Accu-Chek Guide", maker: "Roche", kind: "glucometer", gives: ["glucose"] },
  { name: "OneTouch Verio Reflect", maker: "LifeScan", kind: "glucometer", gives: ["glucose"] },
  { name: "Contour Next One", maker: "Ascensia", kind: "glucometer", gives: ["glucose"] },
  { name: "Apple Watch", maker: "Apple", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2"] },
  { name: "Oura Ring", maker: "Oura", kind: "ring", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2", "skin_temp"] },
  { name: "Whoop", maker: "Whoop", kind: "band", gives: ["sleep", "heart_rate", "hrv", "spo2", "skin_temp"] },
  { name: "Fitbit Charge", maker: "Google", kind: "band", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2"] },
  { name: "Fitbit Sense", maker: "Google", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2", "skin_temp"] },
  { name: "Pixel Watch", maker: "Google", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2"] },
  { name: "Garmin Venu", maker: "Garmin", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2"] },
  { name: "Garmin Forerunner", maker: "Garmin", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2"] },
  { name: "Garmin vivoactive", maker: "Garmin", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv"] },
  { name: "Galaxy Watch", maker: "Samsung", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2", "skin_temp"] },
  { name: "Galaxy Ring", maker: "Samsung", kind: "ring", gives: ["sleep", "steps", "heart_rate", "hrv", "skin_temp"] },
  { name: "Ultrahuman Ring Air", maker: "Ultrahuman", kind: "ring", gives: ["sleep", "steps", "heart_rate", "hrv", "skin_temp"] },
  { name: "Amazfit", maker: "Zepp Health", kind: "watch", gives: ["sleep", "steps", "heart_rate", "spo2"] },
  { name: "Mi Band", maker: "Xiaomi", kind: "band", gives: ["sleep", "steps", "heart_rate", "spo2"] },
  { name: "Withings ScanWatch", maker: "Withings", kind: "watch", gives: ["sleep", "steps", "heart_rate", "spo2"] },
  { name: "Polar", maker: "Polar", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv"] },
  { name: "Coros", maker: "Coros", kind: "watch", gives: ["sleep", "steps", "heart_rate", "hrv", "spo2"] },
  { name: "Phone only (Apple Health or Google Fit)", maker: "", kind: "band", gives: ["steps", "sleep"] },
  { name: "Withings Body smart scale", maker: "Withings", kind: "scale", gives: ["weight"] },
  { name: "Omron blood pressure cuff", maker: "Omron", kind: "bp", gives: ["blood_pressure", "heart_rate"] },
];
export const KIND_WORDS: Record<DeviceKind, string> = { cgm: "continuous glucose sensor", glucometer: "finger-stick meter", watch: "watch", ring: "ring", band: "band", scale: "scale", bp: "blood pressure cuff" };

export function searchDevices(q: string, limit = 8): Device[] {
  const t = q.trim().toLowerCase();
  if (!t) return [];
  return DEVICES.filter((d) => `${d.maker} ${d.name} ${KIND_WORDS[d.kind]}`.toLowerCase().includes(t)).slice(0, limit);
}
export const isGlucose = (d: Device) => d.kind === "cgm" || d.kind === "glucometer";
