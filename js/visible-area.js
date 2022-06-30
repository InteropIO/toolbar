import * as glueModule from './glue-related.js';

let topMenuVisibleObs = new rxjs.BehaviorSubject(false);
let layoutDropDownVisibleObs = new rxjs.BehaviorSubject(false);
let openTopObs = new rxjs.BehaviorSubject(false);
let openLeftObs = new rxjs.BehaviorSubject(false);
let layoutOpenedTimeout;

init();

function init() {
  q('.layouts-nav').addEventListener('mouseenter', (e) => {
    if (
      e.target.matches &&
      e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')
    ) {
      layoutOpenedTimeout = setTimeout(() => {
        applyOpenClasses();
        layoutDropDownVisibleObs.next(true);
      }, 300);
    }
  });

  q('.layouts-nav').addEventListener('mouseleave', (e) => {
    if (
      e.target.matches &&
      e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')
    ) {
      layoutDropDownVisibleObs.next(false);

      if (layoutOpenedTimeout) {
        clearInterval(layoutOpenedTimeout);
      }
    }
  });

  let appBoundsObs = new rxjs.BehaviorSubject({
    width: Math.round(q('.app').offsetWidth),
    height: Math.round(q('.app').offsetHeight),
    left: 200,
    top: 50,
  });
  window.appBoundsObs = appBoundsObs;

  glueModule.boundsObs
    .pipe(rxjs.operators.filter((bounds) => bounds))
    .subscribe((windowBounds) => {
      glueModule.getMonitorInfo().then((monitors) => {
        const launcherBounds = q('.view-port').getBoundingClientRect();
        let viewPortBounds = {
          left: windowBounds.left + launcherBounds.left,
          top: windowBounds.top + launcherBounds.top,
          height: launcherBounds.height,
          width: launcherBounds.width,
        };
        let currentMonitor = getMonitor(viewPortBounds, monitors);

        if (!currentMonitor) {
          q('.view-port').classList.add('expand');
          q('.app').classList.add('expand-wrapper');
          return;
        }

        if (!q('.view-port').classList.contains('horizontal')) {
          let shouldOpenLeft =
            viewPortBounds.left + 500 >
            currentMonitor.left + currentMonitor.width;

          openLeftObs.next(shouldOpenLeft);

          if (shouldOpenLeft) {
            openTopObs.next(false);
          }
        } else {
          let shouldOpenTop =
            viewPortBounds.top + viewPortBounds.height + 300 >
            currentMonitor.workingAreaTop + currentMonitor.workingAreaHeight;

          openTopObs.next(shouldOpenTop);

          if (shouldOpenTop) {
            openLeftObs.next(false);
          }
        }
      });
    });

  appBoundsObs
    .pipe(
      rxjs.operators.combineLatest(topMenuVisibleObs, layoutDropDownVisibleObs)
    )
    .subscribe(([appBounds, topMenuVisible, layoutDropDownVisible]) => {
      resizeVisibleArea(appBounds, topMenuVisible, layoutDropDownVisible);
    });
}

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      //dropdown button click  - toggle dropdown
      applyOpenClasses();
      let btnElement = e.path.find((e) => e.getAttribute('dropdown-button-id'));
      let menuId = btnElement.getAttribute('dropdown-button-id');
      let menu = q(`[dropdown-id="${menuId}"]`);

      menu.classList.toggle('show');
      topMenuVisibleObs.next(menu.classList.contains('show'));
    } else {
      //click is not on dropdown button - close opened dropdowns
      qa(`[dropdown-id].show`).forEach((e) => e.classList.remove('show'));
      topMenuVisibleObs.next(false);
    }
  });
}

function applyOpenClasses() {
  if (q('.has-drawer')) {
    return;
  }

  let openLeft = openLeftObs.value;
  let openTop = openTopObs.value;

  if (openLeft && !q('.view-port.horizontal')) {
    document.body.classList.add('open-left');
  }

  if (openTop && q('.view-port.horizontal')) {
    document.body.classList.add('open-top');
  }

  if (!openLeft) {
    document.body.classList.remove('open-left');
  }

  if (!openTop) {
    document.body.classList.remove('open-top');
  }

  return new Promise((res, rej) => {
    setTimeout(() => {
      res();
    });
  });
}

function handleWidthChange() {
  const appBoundsObserver = new ResizeObserver((elements) => {
    appBoundsObs.next(true);
  });

  appBoundsObserver.observe(q('.app'));
}

function resizeVisibleArea(appBounds, topMenuVisible, layoutDropDownVisible) {
  let visibleAreas = [];

  appBounds = q('.app').getBoundingClientRect();
  visibleAreas.push({
    top: Math.round(appBounds.top),
    left: Math.round(appBounds.left),
    width: Math.round(appBounds.width),
    height: Math.round(appBounds.height),
  });

  if (q('.view-port.horizontal') && topMenuVisible) {
    let { top, left, width, height } = q('#menu-top').getBoundingClientRect();

    // TODO
    top = Math.round(top);
    left = Math.round(left);
    width = Math.round(width);
    height = Math.round(height);
    visibleAreas.push({ top, left, width, height });
  }

  if (layoutDropDownVisible) {
    let { top, left, width, height } =
      q('.layout-menu-tool').getBoundingClientRect();

    // TODO
    top = Math.round(top);
    left = Math.round(left);
    width = Math.round(width);
    height = Math.round(height);
    // TODO
    visibleAreas.push({ top, left, width, height });
  }

  glueModule.resizeWindowVisibleArea(visibleAreas);
}

function getMonitor(bounds, displays) {
  const monitorsSortedByOverlap = displays
    .map((m) => {
      const {
        left,
        top,
        workingAreaWidth: width,
        workingAreaHeight: height,
      } = m;
      const overlap = calculateTotalOverlap(
        { left, top, width, height },
        bounds
      );

      return {
        monitor: m,
        totalOverlap: overlap,
      };
    })
    .sort((a, b) => b.totalOverlap - a.totalOverlap);

  if (!monitorsSortedByOverlap.find((m) => m.totalOverlap > 0)) {
    return false;
  }

  return monitorsSortedByOverlap[0].monitor;
}

function calculateTotalOverlap(r1, r2) {
  const r1x = r1.left;
  const r1y = r1.top;
  const r1xMax = r1x + r1.width;
  const r1yMax = r1y + r1.height;

  const r2x = r2.left;
  const r2y = r2.top;
  const r2xMax = r2x + r2.width;
  const r2yMax = r2y + r2.height;

  const xOverlap = Math.max(0, Math.min(r1xMax, r2xMax) - Math.max(r1x, r2x));
  const yOverlap = Math.max(0, Math.min(r1yMax, r2yMax) - Math.max(r1y, r2y));

  return xOverlap * yOverlap;
}

export {
  handleWidthChange,
  handleDropDownClicks,
  applyOpenClasses,
  getMonitor,
};
