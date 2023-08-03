import { gluePromise } from './connect-related.js';

let gssPromise;
let currentEntityTypes = [];

init();

function init() {
  gssPromise = new Promise(async (res, rej) => {
    let glue = await gluePromise;
    let gssInstance = new gss.GlueSearchService(glue.agm);

    window['gssInstance'] = gssInstance;
    gssInstance
      .ready()
      .then(() => {
        console.debug('GSS ready');
        gssInstance.onEntityTypes((err, entityTypes) => {
          if (err) {
            console.log('GSS onEntityTypes failed', err);
          } else {
            currentEntityTypes = entityTypes.entries().map((e) => e[0]);
          }
        });
        res(gssInstance);
      })
      .catch((err) => {
        console.log('GSS initialization failed', err);
      });
  });
}

function getCurrentEntityTypes() {
  return currentEntityTypes;
}

export { gssPromise, getCurrentEntityTypes };
