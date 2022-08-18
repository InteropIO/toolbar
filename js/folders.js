import { refreshApps } from './index.js';

let foldersState = {};

function changeFolderState(folderName, newState) {
  foldersState[folderName] = foldersState[folderName] || {};
  foldersState[folderName].isOpened = newState;
  refreshApps();
}

console.log('init is folder opened');

function isFolderOpened(folderName) {
  return foldersState[folderName] && foldersState[folderName].isOpened;
}

export { changeFolderState, isFolderOpened };
