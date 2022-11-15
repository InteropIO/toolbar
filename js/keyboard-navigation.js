import { getSetting } from './settings.js';
import { layoutDropDownVisibleObs } from './visible-area.js';

function handleKeyboardNavigation() {
  listenBodyClicks();
  let disableLeftRight = false;
  let currentItem;
  let clickedItem;

  function getActiveNodeFolderName(node) {
    const folderName = node.getAttribute('folder-name');
    return qa(`.nav-item[folder-name="${folderName}"]`)[0];
  }

  function getStartingListInMainMenu() {
    return q('.viewport .nav-tabs');
  }

  function getStartingUlInToggleView() {
    const visibleContent = q('.toggle-content:not(.hide)');
    if (visibleContent) {
      const children = visibleContent.children;
      return [...children].find(
        (el) => el.tagName && el.tagName.toLowerCase() == 'ul'
      );
    }
  }

  function getInput() {
    return q('.toggle-content:not(.hide)')?.querySelector(
      '.form-control.input-control'
    );
  }

  function getActionsMenuItems(item) {
    if (item?.id === 'layout-menu-tool') {
      return [...item.querySelectorAll('.nav-item')];
    }
    if (item?.parentElement?.classList?.contains('layout-menu-tool')) {
      return [...item.parentElement.querySelectorAll('.nav-item')];
    }
  }

  function isAppElement(e) {
    return !!e?.getAttribute('app-name');
  }

  function isFolderElement(e) {
    return e?.matches('.folder');
  }

  function isInput(e) {
    return e?.matches('.form-control.input-control');
  }

  function isSaveInput(e) {
    return e?.id === 'layout-save-name';
  }

  function isFolderOpenedElement(e) {
    return e?.matches('.folder.folder-open');
  }

  function isLayoutDeleteButton(e) {
    return e?.matches('.delete-layout');
  }

  function isLayoutDeleteOrCancel(e) {
    return e?.matches('.delete') || e?.matches('.cancel');
  }

  const isLayoutItem = () =>
    upTo(currentItem, (el) => {
      let layoutOpenedTimeout;

      if (el?.id === 'layout-menu-tool') {
        const isVertical = getSetting('vertical');

        if (!isVertical) {
          layoutOpenedTimeout = setTimeout(() => {
            layoutDropDownVisibleObs.next(true);
          }, 500);
        }
        return el?.id === 'layout-menu-tool';
      } else {
        setTimeout(() => {
          layoutDropDownVisibleObs.next(false);
        }, 500);

        if (layoutOpenedTimeout) {
          clearInterval(layoutOpenedTimeout);
        }
      }
    });

  const isDrawerOpenDirectionDifferent = () => {
    return q('.app')
      .className.split(' ')
      .some((cn) => /open-.*/.test(cn));
  };

  const isItemInToggleView = (e) =>
    upTo(e, (el) => {
      return el?.classList && el.classList?.contains('toggle-content');
    });

  const isItemInFolder = (e) =>
    upTo(e, (el) => {
      return el?.classList && el.classList?.contains('folder');
    });

  const isItemAppFavorite = (e) =>
    upTo(e, (el) => {
      return el?.id === 'fav-apps';
    });

  const isItemFromMainMenu = (e) =>
    upTo(e, (el) => {
      return el?.id === 'applicationLauncher';
    });

  const isItemFromActionsMenu = (item) =>
    upTo(item, (el) => {
      return (
        el?.id === 'layout-menu-tool' ||
        el?.classList?.contains('layout-menu-tool')
      );
    });

  function reset(e) {
    if (e.isTrusted) {
      removeHover(false);
      currentItem = undefined;
      clickedItem = undefined;
    }
  }

  function listenBodyClicks() {
    document.addEventListener('click', reset);
  }

  function itemClicked() {
    if (!currentItem) {
      return;
    }
    if (currentItem.id === 'layout-menu-tool') {
      return;
    }
    currentItem.click();
    removeHover();

    if (isAppElement(currentItem)) {
      // nothing
    } else if (isFolderElement(currentItem)) {
      currentItem = getActiveNodeFolderName(currentItem);
    } else if (isLayoutDeleteButton(currentItem)) {
      const li = upToElement(currentItem, 'li');
      currentItem = getFirstList(li)?.firstElementChild;
    } else if (isLayoutDeleteOrCancel(currentItem)) {
      if (currentItem.matches('.delete')) {
        const ul = upToElement(currentItem.parentElement, 'ul');
        currentItem = ul?.firstElementChild;
      } else {
        currentItem = upToElement(currentItem, 'li');
      }
    } else if (q('.toggle-content:not(.hide)')) {
      clickedItem = currentItem;
      currentItem = getInput();
    }
    if (isLayoutItem(currentItem)) {
      currentItem.parentElement.parentElement.classList.remove('hover');
    }
    addHover();
  }

  function upToElement(el, tagName) {
    tagName = tagName.toLowerCase();

    while (el && el.parentNode) {
      el = el.parentNode;
      if (el.tagName && el.tagName.toLowerCase() == tagName) {
        return el;
      }
    }
    return null;
  }

  function upTo(el, func) {
    if (func(el)) {
      return el;
    }

    if (isInput(el)) {
      disableLeftRight = true;
    } else {
      disableLeftRight = false;
    }

    while (el && el.parentNode) {
      el = el.parentNode;
      if (func(el)) {
        return el;
      }
    }
    return null;
  }

  function getConnectedNode(item) {
    if (item.id !== '') {
      return document.getElementById(item.id);
    }
    const attributes = [...item.attributes]
      .filter((a) => a.name !== 'class')
      .map((a) => `[${a.name}="${a.value}"]`)
      .join('');
    const classList = [...item.classList].join('.');
    const classAsString = classList.length > 0 ? `.${classList}` : '';
    const found = qa(`${item.nodeName}${classAsString}${attributes ?? ''}`)[0];
    return found;
  }

  function addRemoveFavouriteApp() {
    const itemHasAddRemove = currentItem?.querySelector('.add-favorite');
    if (itemHasAddRemove) {
      itemHasAddRemove.click();
    }
  }

  function makeSureNodeIsConnected() {
    if (currentItem && !currentItem.isConnected) {
      currentItem = getConnectedNode(currentItem);
    }
  }

  function removeHover(input = true) {
    if (input) {
      const input = getInput();
      if (input?.id && document.activeElement.id) {
        input.blur();
      }
    }
    if (isLayoutItem(currentItem) || isLayoutDeleteOrCancel(currentItem)) {
      currentItem.parentElement.parentElement.classList.remove('hover');
    }
    currentItem?.classList?.remove('hover');
  }

  function addHover() {
    if (isLayoutItem(currentItem) || isLayoutDeleteOrCancel(currentItem)) {
      currentItem.parentElement.parentElement.classList.add('hover');
    }
    if (isInput(currentItem)) {
      currentItem.focus();
    }
    currentItem?.classList?.add('hover');
  }

  function start() {
    if (!currentItem) {
      const input = getInput();
      if (input?.id && document.activeElement.id) {
        let ul = getFirstList(input.parentElement.parentElement);
        if (isSaveInput(input)) {
          ul = getFirstList(input.parentElement.parentElement.parentElement);
        }
        removeHover();
        currentItem = ul.querySelector('.nav-item');
      } else {
        currentItem = q('.viewport .nav-tabs')?.querySelector('.nav-item');
      }
    }
  }

  function getFirstList(item) {
    const ulNode = [...item.children].find((child) => child.nodeName === 'UL');
    return ulNode;
  }

  function go(direction = 'up') {
    makeSureNodeIsConnected();

    let nextItem;
    const isVertical = getSetting('vertical');
    if (!isVertical) {
      if (direction === 'right') {
        direction = 'down';
      } else if (direction === 'left') {
        direction = 'up';
      }
    }
    if (
      !isItemFromActionsMenu(currentItem) &&
      (direction === 'left' || direction === 'right')
    ) {
      if (isDrawerOpenDirectionDifferent()) {
        if (direction === 'left') {
          direction = 'right';
        } else if (direction === 'right') {
          direction = 'left';
        }
      }
      if (isItemFromMainMenu(currentItem)) {
        const mainList = getStartingUlInToggleView();
        if (!mainList) {
          return;
        }
        if (
          clickedItem &&
          !isItemFromMainMenu(clickedItem) &&
          isItemInToggleView(clickedItem)
        ) {
          nextItem = clickedItem;
        } else {
          nextItem = mainList.querySelector('.nav-item');
        }
      } else if (isItemInToggleView(currentItem)) {
        if (
          clickedItem &&
          !isItemInToggleView(clickedItem) &&
          isItemFromMainMenu(clickedItem)
        ) {
          nextItem = clickedItem;
        } else {
          const mainList = getStartingListInMainMenu();
          nextItem = mainList.querySelector('.nav-item');
        }
      } else {
        // do nothing;
        return;
      }
    } else if (
      isItemFromActionsMenu(currentItem) ||
      direction === 'up' ||
      direction === 'down'
    ) {
      if (isVertical) {
        nextItem = next(currentItem, direction);
      } else {
        nextItem = next(currentItem, direction);
      }
    }
    removeHover();
    currentItem = nextItem;
    addHover();
    currentItem?.scrollIntoViewIfNeeded();
  }

  function next(item, direction) {
    if (!item) {
      start();
      return currentItem;
    }
    const isNavItem = () =>
      item &&
      item.classList.contains('nav-item') &&
      !item.classList.contains('d-none');
    do {
      let items = [];
      if (isNavItem(item)) {
        if (isItemFromActionsMenu(item)) {
          if (direction === 'left' || direction === 'right') {
            items = getActionsMenuItems(item);
          } else {
            items = [...item.parentElement.querySelectorAll('.nav-item')];
            items = items.filter(
              (i) => upToElement(i, 'li')?.id !== 'layout-menu-tool'
            );
          }
        } else if (isLayoutDeleteOrCancel(item)) {
          items = [...item.parentElement.querySelectorAll('.nav-item')];
        } else {
          items = [
            ...item.parentElement.querySelectorAll(
              '.nav-item:not(.delete):not(.cancel)'
            ),
          ];
        }
        if (isFolderOpenedElement(item.parentElement?.parentElement)) {
          items.unshift(item.parentElement?.parentElement);
        }
      } else if (isInput(item)) {
        let ul = getFirstList(item.parentElement.parentElement);
        if (isSaveInput(item)) {
          ul = getFirstList(item.parentElement.parentElement.parentElement);
        }
        items = [...ul.querySelectorAll('.nav-item')];
      }

      if (isItemInToggleView(item) && !isItemFromActionsMenu(item)) {
        const input = getInput();
        if (input) {
          items.unshift(input);
        }
      }
      items = items.filter((i) => {
        const parentUL = upToElement(i, 'li');
        if (
          parentUL &&
          isFolderElement(parentUL) &&
          !isFolderOpenedElement(parentUL)
        ) {
          return false;
        }
        return true;
      });
      let index = items.findIndex((i) => {
        return i === item;
      });
      let temp = items[index - 1];
      if (direction === 'down') {
        temp = items[index + 1];
      }

      if (!temp) {
        if (isItemInFolder(item)) {
          const mainList = upTo(
            item,
            (el) =>
              el.tagName?.toLowerCase() == 'ul' &&
              el?.classList?.contains('nav-tabs')
          );
          items = [...mainList.querySelectorAll('.nav-item')];
          index = items.findIndex((i) => {
            return i === item;
          });
        } else if (isItemFromActionsMenu(item)) {
          if (direction === 'up' || direction === 'down') {
            const li = getActionsMenuItems(item)[0];
            item = li.parentElement.parentElement;
            items = [
              ...li.parentElement.parentElement.parentElement.querySelectorAll(
                '.nav-item'
              ),
            ];
            items = items.filter(
              (i) => upToElement(i, 'li')?.id !== 'layout-menu-tool'
            );
            index = items.findIndex((i) => {
              return i === item;
            });
          }
        } else if (isItemFromMainMenu(item)) {
          const mainList = upTo(
            item,
            (el) =>
              el.tagName?.toLowerCase() == 'div' &&
              el?.id === 'applicationLauncher'
          ).firstElementChild;
          items = [...mainList.querySelectorAll('.nav-item')];
          items = items.filter(
            (i) => upToElement(i, 'li')?.id !== 'layout-menu-tool'
          );
          index = items.findIndex((i) => {
            return i === item;
          });
        }
        if (items.length === 0) {
          break;
        }
        if (direction === 'down') {
          if (index + 1 >= items.length) {
            item = items[0];
          } else {
            item = items[index + 1];
          }
        } else {
          if (index - 1 < 0) {
            item = items[items.length - 1];
          } else {
            item = items[index - 1];
          }
        }
      } else {
        item = temp;
      }
    } while (!isNavItem() && !isInput(item));
    return item;
  }

  document.addEventListener('keydown', (e) => {
    q('.app').classList.add('expand-wrapper');
    q('.viewport').classList.add('expand');
    switch (e.key) {
      case 'Space':
      case ' ':
        addRemoveFavouriteApp();
        break;
      case 'Delete':
        const deleteButton = currentItem.querySelector('.delete-layout');
        if (deleteButton) {
          currentItem = deleteButton;
          itemClicked();
        }
        break;
      case 'Tab':
        e.preventDefault();
        go('down');
        break;
      case 'Escape':
        const visibleDrawers = q('.toggle-content:not(.hide)');
        if (visibleDrawers) {
          const menuId = visibleDrawers.getAttribute('menu-id');
          const button = q(`[menu-button-id="${menuId}"]`);
          button?.click();
        }
        removeHover();
        currentItem = undefined;
        break;
      case 'Enter':
        itemClicked();
        break;
      case 'ArrowUp':
        go('up');
        break;
      case 'ArrowRight':
        if (disableLeftRight) {
          break;
        }
        go('right');
        break;
      case 'ArrowDown':
        go('down');
        break;
      case 'ArrowLeft':
        if (disableLeftRight) {
          break;
        }
        go('left');
        break;
      default:
        break;
    }
  });
}

export default handleKeyboardNavigation;
