import fetch from "node-fetch";
import { buildRequest } from "./request";
import { serialize, asyncForEach } from "./util";
import { parse, parse as parseXML } from "fast-xml-parser";

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
	guestPolicy?: "ALWAYS_ACCEPT" | "ALWAYS_DENY" | "ASK_MODERATOR";
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

type BigbluebuttonAttendee = {
	userID: string;
	fullName: string;
	role: "VIEWER" | "MODERATOR";
	isPresenter: boolean;
	isListeningOnly: boolean;
	hasJoinedVoice: boolean;
	hasVideo: boolean;
	clientType: "HTML5" | "FLASH";
};

type BigbluebuttonMeetingInfo = {
	meetingName: string;
	meetingID: string;
	internalMeetingID: string;
	createTime: number;
	created: Date;
	voiceBridge?: string;
	dialNumber?: string;
	attendeePW: string;
	moderatorPW: string;
	running: boolean;
	duration: number;
	hasUserJoined: boolean;
	recording: boolean;
	hasBeenForciblyEnded: boolean;
	startTime?: number;
	endTime?: number;
	participantCount: number;
	listenerCount: number;
	voiceParticipantCount: number;
	videoCount: number;
	maxUsers: number;
	moderatorCount: number;
	attendees: BigbluebuttonAttendee[];
	isBreakout: boolean;
	breakoutRooms?: number[];
	breakout?: {
		parentMeetingID: string;
		sequence: number;
		freeJoin: boolean;
	};
};

export default class BigBlueButton {
	host: string;
	secret: string;

	constructor(host: string, secret: string) {
		this.host = host;
		this.secret = secret;
	}

	public async createMeeting(
		params: BigbluebuttonCreateParams
	): Promise<BigbluebuttonCreateResponse> {
		const response = await this.request("create", { ...params });
		let returnValues: BigbluebuttonCreateResponse = {
			meetingID: response.meetingID,
			internalMeetingID: response.internalMeetingID,
			attendeePW: response.attendeePW,
			moderatorPW: response.moderatorPW,
			created: new Date(response.createTime),
			duration: response.duration,
			hasBeenForciblyEnded: response.hasBeenForciblyEnded,
			hasUserJoined: response.hasUserJoined,
			createTime: response.createTime,
		};
		if (response.voiceBridge) returnValues.voiceBridge = response.voiceBridge;
		if (response.dialNumber) returnValues.dialNumber = response.dialNumber;
		return returnValues;
	}

	public async joinMeeting(
		params: BigbluebuttonJoinParams
	): Promise<BigbluebuttonJoinResponse> {
		const response = await this.request("join", {
			...params,
			redirect: "FALSE",
		});
		let returnValues: BigbluebuttonJoinResponse = {
			meetingID: response.meeting_id,
			userID: response.user_id,
			authToken: response.auth_token,
			sessionToken: response.session_token,
			url: response.url,
		};
		return returnValues;
	}

	public async isMeetingRunning(meetingID: string): Promise<boolean> {
		const response = await this.request("isMeetingRunning", {
			meetingID: meetingID,
		});
		return response.running;
	}

	public async endMeeting(params: {
		meetingID: string;
		password: string;
	}): Promise<boolean> {
		await this.request("end", { ...params });
		return true;
	}

	public async getMeetingInfo(
		meetingID: string
	): Promise<BigbluebuttonMeetingInfo> {
		const response = await this.request("getMeetingInfo", {
			meetingID: meetingID,
		});
		if (response.returncode && response.returncode === "SUCCESS") {
			let attendees: BigbluebuttonAttendee[] = [];
			if (response.attendees.attendee) {
				await asyncForEach(
					response.attendees.attendee,
					async function (attendee: BigbluebuttonAttendee) {
						attendees.push(attendee);
					}
				);
			}
			let returnValues: BigbluebuttonMeetingInfo = {
				meetingID: response.meetingID,
				meetingName: response.meetingName,
				internalMeetingID: response.internalMeetingID,
				startTime: response.startTime,
				createTime: response.createTime,
				created: new Date(response.createTime),
				attendeePW: response.attendeePW,
				moderatorPW: response.moderatorPW,
				moderatorCount: response.moderatorCount,
				participantCount: response.participantCount,
				running: response.running,
				duration: response.duration,
				hasUserJoined: response.hasUserJoined,
				recording: response.recording,
				hasBeenForciblyEnded: response.hasBeenForciblyEnded,
				listenerCount: response.listenerCount,
				voiceParticipantCount: response.voiceParticipantCount,
				videoCount: response.videoCount,
				isBreakout: response.isBreakout,
				maxUsers: response.maxUsers,
				attendees: attendees,
			};
			return returnValues;
		}
	}

	public async getMeetings(): Promise<BigbluebuttonMeetingInfo[]> {
		const response = await this.request("getMeetings", {});
		let meetings: BigbluebuttonMeetingInfo[] = [];
		if (response.meetings.meeting && response.meetings.meeting.length >= 1) {
			await asyncForEach(
				response.meetings.meeting,
				async function (meeting: any) {
					let attendees: BigbluebuttonAttendee[] = [];
					if (response.attendees.attendee) {
						await asyncForEach(
							meeting.attendees.attendee,
							async function (attendee: BigbluebuttonAttendee) {
								attendees.push(attendee);
							}
						);
					}
					meetings.push({
						meetingID: meeting.meetingID,
						meetingName: meeting.meetingName,
						internalMeetingID: meeting.internalMeetingID,
						startTime: meeting.startTime,
						createTime: meeting.createTime,
						created: meeting.createTime,
						attendeePW: meeting.attendeePW,
						moderatorPW: meeting.moderatorPW,
						moderatorCount: meeting.moderatorCount,
						participantCount: meeting.participantCount,
						running: meeting.running,
						duration: meeting.duration,
						hasUserJoined: meeting.hasUserJoined,
						recording: meeting.recording,
						hasBeenForciblyEnded: meeting.hasBeenForciblyEnded,
						listenerCount: meeting.listenerCount,
						voiceParticipantCount: meeting.voiceParticipantCount,
						videoCount: meeting.videoCount,
						isBreakout: meeting.isBreakout,
						maxUsers: meeting.maxUsers,
						attendees: attendees,
					});
				}
			);
			return meetings;
		} else return meetings;
	}

	private async request(method: string, params: any): Promise<any> {
		const _response = await fetch(this.buildRequest(method, serialize(params)));
		if (_response.status === 200) {
			const response = parseXML(await _response.text()).response;
			if (response.returncode && response.returncode === "SUCCESS") {
				return response;
			} else throw new Error(`API call failed: ${response.message}`);
		} else throw new Error(`HTTP ${_response.status}`);
	}

	private buildRequest(method: string, params: string): string {
		return buildRequest(
			`${this.host}/api/${method}`,
			method,
			params,
			this.secret
		);
	}
}
