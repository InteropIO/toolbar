import * as glueModule from './glue-related.js';

let topMenuVisibleObs = new rxjs.BehaviorSubject(false);
let layoutDropDownVisibleObs = new rxjs.BehaviorSubject(false);

function handleDropDownClicks() {
  document.addEventListener('click', (e) => {
    if (e.target.matches('[dropdown-button-id], [dropdown-button-id] *')) {
      //dropdown button click  - toggle dropdown
      let btnElement = e.path.find(e => e.getAttribute('dropdown-button-id'));
      let menuId = btnElement.getAttribute('dropdown-button-id');
      let menu = q(`[dropdown-id="${menuId}"]`);
      menu.classList.toggle('show');
      topMenuVisibleObs.next(menu.classList.contains('show'));
    } else {
      //click is not on dropdown button - close opened dropdowns
      qa(`[dropdown-id].show`).forEach(e => e.classList.remove('show'));
      topMenuVisibleObs.next(false);
    }
  });
}



let layoutOpenedTimeout;

q('.layouts-nav').addEventListener('mouseenter', (e) => {
  if (e.target.matches && e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')) {
    console.log('layout ', true);
    layoutOpenedTimeout = setTimeout(() => {
      layoutDropDownVisibleObs.next(true);
    }, 300);
  }
});

q('.layouts-nav').addEventListener('mouseleave', (e) => {
  if (e.target.matches && e.target.matches('.horizontal .layouts-nav, .horizontal .layouts-nav *')) {
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
  top: 50
});
window.appBoundsObs = appBoundsObs;

glueModule.boundsObs
  .pipe(rxjs.operators.skip(2))
  .subscribe(bounds => {
    q('.view-port').classList.add('expand');
    q('.app').classList.add('expand-wrapper');
  });

glueModule.boundsObs
.pipe(rxjs.operators.filter(bounds => bounds))
.pipe(rxjs.operators.combineLatest(appBoundsObs))
.subscribe(([windowBounds, appBounds]) => {
  const monitors = glueModule.getMonitorInfo();
  const launcherBounds = q('.view-port').getBoundingClientRect();
  let viewPortBounds = {
    left: windowBounds.left + launcherBounds.left,
    top: windowBounds.top + launcherBounds.top,
    height: launcherBounds.height,
    width: launcherBounds.width,
  };
  let currentMonitor = getMonitor(viewPortBounds, monitors);
  if (!currentMonitor) {
    return;
  }

  if(q('.app').classList.contains('has-drawer')) {
    return;
  }

  if(!q('.view-port').classList.contains('horizontal')) {
    let hasOpenLeft = document.body.classList.contains('open-left');
    // let shouldOpenLeft = (windowBounds.left + windowBounds.width) > (currentMonitor.workingAreaLeft + currentMonitor.workingAreaWidth);
    let shouldOpenLeft = (viewPortBounds.left + 500) > (currentMonitor.left + currentMonitor.width);
    if (shouldOpenLeft){
      document.body.classList.add('open-left');
    } else {
      document.body.classList.remove('open-left');
    }

    if (hasOpenLeft !== shouldOpenLeft) {
      appBoundsObs.next(true);
    }
  } else {
    let hasOpenTop = document.body.classList.contains('open-top');
    let shouldOpenTop = (viewPortBounds.top + viewPortBounds.height + 300) > (currentMonitor.workingAreaTop + currentMonitor.workingAreaHeight);

    if (shouldOpenTop) {
      document.body.classList.add('open-top');
    } else {
      document.body.classList.remove('open-top');
    }

    if (hasOpenTop !== shouldOpenTop) {
      appBoundsObs.next(true);
    }
  }
});


function handleWidthChange() {
  const appBoundsObserver = new ResizeObserver((elements) => {
    appBoundsObs.next(true);
  });

  appBoundsObserver.observe(q('.app'));
}

appBoundsObs
.pipe(rxjs.operators.combineLatest(topMenuVisibleObs, layoutDropDownVisibleObs))
// .pipe(rxjs.operators.combineLatest())
.subscribe(([appBounds, topMenuVisible, layoutDropDownVisible]) => {
  // console.log(appBounds, topMenuVisible, layoutDropDownVisible);
  resizeVisibleArea(appBounds, topMenuVisible, layoutDropDownVisible);
});

function resizeVisibleArea(appBounds, topMenuVisible, layoutDropDownVisible) {
  let visibleAreas = [];
  appBounds = q('.app').getBoundingClientRect();
  visibleAreas.push({
    top: Math.round(appBounds.top),
    left: Math.round(appBounds.left),
    width: Math.round(appBounds.width),
    height: Math.round(appBounds.height)
  });

  if (q('.view-port.horizontal') && topMenuVisible) {
    let {top, left, width, height} = q('#menu-top').getBoundingClientRect();
    // TODO
    top = Math.round(top);
    left = Math.round(left);
    width = Math.round(width);
    height = Math.round(height);
    visibleAreas.push({top, left, width, height});
  }

  if (layoutDropDownVisible) {
    let {top, left, width, height} = q('.layout-menu-tool').getBoundingClientRect();
    // TODO
    top = Math.round(top);
    left = Math.round(left);
    width = Math.round(width);
    height = Math.round(height);
    // TODO
    visibleAreas.push({top, left, width, height});
  }

  glueModule.resizeWindowVisibleArea(visibleAreas);
}

function getMonitor(bounds, displays) {
  const monitorsSortedByOverlap = displays.map((m) => {
      const { left, top, workingAreaWidth: width, workingAreaHeight: height } = m;
      const overlap = calculateTotalOverlap({ left, top, width, height }, bounds);
      return {
          monitor: m,
          totalOverlap: overlap
      };
  }).sort((a, b) => b.totalOverlap - a.totalOverlap);

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
  handleDropDownClicks
}