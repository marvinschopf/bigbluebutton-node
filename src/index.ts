import fetch from "node-fetch";
import {buildRequest} from "./request";
import {serialize} from "./util";
import {parse as parseXML} from "fast-xml-parser";

type BigbluebuttonCreateParams = {
    name?: string;
    meetingID: string;
    attendeePW?: string;
    moderatorPW?: string;
    welcome?: string;
    dialNumber?: string;
    maxParticipants?: number;
    logoutUrl?: string;
    record?: boolean;
    duration?: number;
    isBreakout?: boolean;
    parentMeetingID?: string;
    sequence?: number;
    freeJoin?: boolean;
    moderatorOnlyMessage?: string;
    autoStartRecording?: boolean;
    allowStartStopRecording?: boolean;
    webcamsOnlyForModerator?: boolean;
    logo?: string;
    bannerText?: string;
    bannerColor?: string;
    copyright?: string;
    muteOnStart?: boolean;
    allowModsToUnmuteUsers?: boolean;
    lockSettingsDisableCam?: boolean;
    lockSettingsDisableMic?: boolean;
    lockSettingsDisablePrivateChat?: boolean;
    lockSettingsDisablePublicChat?: boolean;
    lockSettingsDisableNote?: boolean;
    lockSettingsLockedLayout?: boolean;
    lockSettingsLockOnJoin?: boolean;
    lockSettingsLockOnJoinConfigurable?: boolean;
    guestPolicy?: "ALWAYS_ACCEPT" | "ALWAYS_DENY" | "ASK_MODERATOR";
};

type BigbluebuttonCreateResponse = {
    meetingID: string;
    internalMeetingID: string;
    parentMeetingID?: string;
    attendeePW: string;
    moderatorPW: string;
    created: Date;
    voiceBridge?: string;
    dialNumber?: string;
    hasUserJoined: boolean;
    duration: number;
    hasBeenForciblyEnded: boolean;
    createTime: number;
};

type BigbluebuttonJoinParams = {
    fullName: string;
    meetingID: string;
    password: string;
    createTime?: number;
    userID?: string;
    webVoiceConf?: string;
    configToken?: string;
    defaultLayout?: string;
    avatarURL?: string;
    clientURL?: string;
    guest?: true;
};

type BigbluebuttonJoinResponse = {
    meetingID: string;
    userID: string;
    authToken: string;
    sessionToken: string;
    url: string;
};

export default class BigBlueButton {
    host: string;
    secret: string;

    constructor(host: string, secret: string) {
        this.host = host;
        this.secret = secret;
    }

    public async createMeeting(params: BigbluebuttonCreateParams): Promise<BigbluebuttonCreateResponse> {
        const requestUrl: string = this.buildRequest("create", serialize({...params}));
        const _response = await fetch(requestUrl);
        if(_response.status === 200) {
            const response = parseXML(await _response.text()).response;
            if(response.returncode && response.returncode === "SUCCESS") {
                let returnValues: BigbluebuttonCreateResponse = {
                    meetingID: response.meetingID,
                    internalMeetingID: response.internalMeetingID,
                    attendeePW: response.attendeePW,
                    moderatorPW: response.moderatorPW,
                    created: new Date(response.createTime),
                    duration: response.duration,
                    hasBeenForciblyEnded: response.hasBeenForciblyEnded,
                    hasUserJoined: response.hasUserJoined,
                    createTime: response.createTime
                };
                if(response.voiceBridge) returnValues.voiceBridge = response.voiceBridge;
                if(response.dialNumber) returnValues.dialNumber = response.dialNumber;
                return returnValues;
            } else throw new Error(`API call failed: ${response.message}`);
        } else throw new Error(`HTTP ${_response.status}`);
    }

    public async joinMeeting(params: BigbluebuttonJoinParams): Promise<BigbluebuttonJoinResponse> {
        const requestUrl: string = this.buildRequest("join", serialize({...params, redirect: "FALSE", joinViaHtml5: "true"}));
        const _response = await fetch(requestUrl);
        if(_response.status === 200) {
            const response = parseXML(await _response.text()).response;
            if(response.returncode && response.returncode === "SUCCESS") {
                let returnValues: BigbluebuttonJoinResponse = {
                    meetingID: response.meeting_id,
                    userID: response.user_id,
                    authToken: response.auth_token,
                    sessionToken: response.session_token,
                    url: response.url
                };
                return returnValues;
            } else throw new Error(`API call failed: ${response.message}`);
        } else throw new Error(`HTTP ${_response.status}`);
    }

    private buildRequest(method: string, params: string): string {
        return buildRequest(`${this.host}/api/${method}`, method, params, this.secret);
    }
};