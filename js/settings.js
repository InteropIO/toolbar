
let defaultSettings = {
  showHiddenApps: false
}

let localStorageSettings;

try {
  localStorageSettings = JSON.parse(localStorage.getItem('toolbar-settings'));
} catch(er) {
  localStorageSettings = {};
}

let settings = Object.assign(defaultSettings, localStorageSettings);

function setInitialSettings() {
  settings['showHiddenApps'] = false;
  settings['showTutorial'] = (settings['showTutorial'] === false) ? false : true
}
setInitialSettings();


function setSetting(settingName, value) {
  console.info('set setting', settingName, value);
  settings[settingName] = value;
  saveSettings();
}

function getSetting(settingName) {
  return settings[settingName];
}

function getSettings() {
  return settings;
}

function saveSettings() {
  localStorage.setItem('toolbar-settings', JSON.stringify(settings));
}

export {
  setSetting,
  getSetting,
  getSettings
}