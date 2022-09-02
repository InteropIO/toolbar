import * as glueModule from './glue-related.js';

let topMenuVisibleObs = new rxjs.BehaviorSubject(false);
let layoutDropDownVisibleObs = new rxjs.BehaviorSubject(false);
let layoutOpenedTimeout;

function initVisibleArea() {
  q('.layouts-nav').addEventListener('mouseenter', (e) => {
    if (
      e.target.matches &&
      e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')
    ) {
      layoutOpenedTimeout = setTimeout(() => {
        // applyOpenClasses();
        layoutDropDownVisibleObs.next(true);
      }, 500);
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
        const launcherBounds = q('.viewport').getBoundingClientRect();
        let viewPortBounds = {
          left: windowBounds.left + launcherBounds.left,
          top: windowBounds.top + launcherBounds.top,
          height: launcherBounds.height,
          width: launcherBounds.width,
        };
        let currentMonitor = getMonitor(viewPortBounds, monitors);

        if (!currentMonitor) {
          q('.viewport').classList.add('expand');
          q('.app').classList.add('expand-wrapper');
          return;
        }
      });
    });
}

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      //dropdown button click  - toggle dropdown
      // applyOpenClasses();

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

function handleWidthChange() {
  const appBoundsObserver = new ResizeObserver((elements) => {
    appBoundsObs.next(true);
  });

  appBoundsObserver.observe(q('.app'));
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

export { initVisibleArea, handleWidthChange, handleDropDownClicks, getMonitor };
