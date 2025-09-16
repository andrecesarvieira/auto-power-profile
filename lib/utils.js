import Gio from "gi://Gio";

// Serviços DBus possíveis para perfis de energia
const POWER_PROFILE_DBUS_SERVICES = [
  [
    "org.freedesktop.UPower.PowerProfiles",
    "/org/freedesktop/UPower/PowerProfiles",
  ],
  ["net.hadess.PowerProfiles", "/net/hadess/PowerProfiles"],
];

// Nome e caminho do objeto DBus para status da bateria
const UPOWER_BUS_NAME = "org.freedesktop.UPower";
const UPOWER_OBJECT_PATH = "/org/freedesktop/UPower/devices/DisplayDevice";

// Cria proxy DBus para perfis de energia
export const createPowerProfilesProxy = (loadInterfaceXML, callback) => {
  for (const [busName, objectPath] of POWER_PROFILE_DBUS_SERVICES) {
    const xml = loadInterfaceXML(busName);
    if (xml) {
      const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(xml);
      return new PowerProfilesProxy(
        Gio.DBus.system,
        busName,
        objectPath,
        callback
      );
    }
  }
  // Se não encontrar serviço, retorna erro
  callback(null, new Error("No power profiles service found"));
};

// Cria proxy DBus para status do dispositivo de energia
export const createPowerManagerProxy = (loadInterfaceXML, callback) => {
  const xml = loadInterfaceXML("org.freedesktop.UPower.Device");
  const PowerManagerProxy = Gio.DBusProxy.makeProxyWrapper(xml);

  return new PowerManagerProxy(
    Gio.DBus.system,
    UPOWER_BUS_NAME,
    UPOWER_OBJECT_PATH,
    callback
  );
};
