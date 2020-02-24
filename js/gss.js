import {gluePromise} from './glue-related.js';

let gssPromise;
let currentEntityTypes = [];

init();
function init() {
  gssPromise = new Promise(async (res, rej) => {
    let glue = await gluePromise;
    let gssInstance = new gss.GlueSearchService(glue.agm);
    window['gssInstance'] = gssInstance;
    gssInstance.ready()
      .then(() => {
        console.debug('GSS ready');
        gssInstance.onEntityTypes((err, entityTypes) => {
          currentEntityTypes = entityTypes.entries().map(e => e[0]);
        });
        // gssInstance.
        res(gssInstance);
      });
  });
}

function getCurrentEntityTypes() {
  return currentEntityTypes;
}

export {
  gssPromise,
  getCurrentEntityTypes
}