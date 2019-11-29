
let settings = {
  showHiddenApps: false
}

function setSetting(settingName, value) {
  settings[settingName] = value;
}

function getSetting(settingName) {
  return settings[settingName];
}

function getSettings() {
  return settings;
}

export {
  setSetting,
  getSetting,
  getSettings
}