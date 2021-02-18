import fetch from "node-fetch";
import {buildRequest} from "./request";
import {serialize} from "./util";

type CreateParams = {
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

type CreateResponse = {
    meetingID: string;
    internalMeetingID: string;
    parentMeetingID?: string;
    attendeePW: string;
    moderatorPW: string;
    created: Date;
    voiceBridge?: string;
    dialNumber?: string;
    hasUserJoined?: boolean;
    duration: number;
    hasBeenForciblyEnded?: boolean;
};

export default class BigBlueButton {
    host: string;
    secret: string;

    constructor(host: string, secret: string) {
        this.host = host;
        this.secret = secret;
    }

    public async createMeeting(params: CreateParams): Promise<void>/*Promise<CreateResponse>*/ {
        const requestUrl: string = this.buildRequest("create", serialize({...params}));
        console.log(requestUrl);
    }

    private buildRequest(method: string, params: string): string {
        return buildRequest(`${this.host}/${method}`, method, params, this.secret);
    }
};