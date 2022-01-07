import * as glueModule from './glue-related.js';

function populateSID() {
    let SID = glueModule.getSID();
    q("#sid").firstChild.data = SID;
}

async function populateProfileData() {
    const envObject = glueModule.getEnvData();
    const GDVer = glueModule.getGDVersion();
    const SID = glueModule.getSID();
    const env = envObject.env;
    const reg = envObject.region;
    const url = new URL(glueModule.getGWURL());
    const port = url.port;
    let serverInfo;
    const serverInfoObj = await glueModule.getServerInfo();
    if(serverInfoObj.initialized === false) {
        serverInfo = "X"
    }

    if (SID.length > 15) {
        const trimmedSID = SID.substring(0, 15) + "...";
        q('.profile-sid').innerText = trimmedSID;
    } else {
        q('.profile-sid').innerText = SID;
    };
    q('.profile-reg').innerText = reg;
    q('.profile-env').innerText = env;
    q('.profile-version').innerText = GDVer;
    q('.profile-gwport').innerText = port;
    q('.server-info').innerText = serverInfo;
}

function profile_handleShutdownClick() {
    q('#Profile_Shutdown').addEventListener('click', () => {
        glueModule.shutdown();
    });
}

function profile_handleRestartClick() {
    q('#Profile_Restart').addEventListener('click', () => {
        glueModule.restart();
    });
}

function profile_handleFeedbackClick() {
    q('#Profile_Feedback').addEventListener('click', () => {
        glueModule.openFeedbackForm();
    });
}


export {
    populateSID,
    populateProfileData,
    profile_handleShutdownClick,
    profile_handleRestartClick,
    profile_handleFeedbackClick
}