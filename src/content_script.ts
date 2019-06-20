import * as $ from "jquery";
import { TabActions } from "./tabActions";
import { addMinutes, toUnixTime } from "./utils";
import { OptionSettings } from "./options";
import { Settings } from "./settings";

const JQ_START_NEW_MEETING = "div:contains('Join or start a meeting'):parent";
const JQ_MEETING_BUTTON = "[data-call-id]";
const JQ_JOIN_MEETING = "[aria-label='Join meeting. ']";
const JQ_CONTINUE_INVITE = "div:contains('Continue'):parent";
const JQ_CLOSE_INVITE = "[aria-label='Close']";
const JQ_START_MEETING = "[aria-label='Start meeting. ']";
const JQ_ENTER_NAME = "[aria-label='Your name']";
const JQ_ASK_TO_JOIN_NAME = "div:contains('Ask to join meeting')";
const JQ_LEAVE_CALL = "[aria-label='Leave call']";
const DEFAULT_CLICK_TIMEOUT = 2000;
const SELECT_COLOR = "#6200EE";

class MeetingSettings {
  currentMeeting: Meeting;
  ignoreOldMeetings: string[];

  constructor() {
    this.ignoreOldMeetings = [];
    this.currentMeeting = new Meeting();
  }
}

class Meeting {
  constructor() {
    this.isNow = false;
    this.callId = "test";
  }

  public beginTime: number;
  public endTime: number;
  public eventId: string;
  public callId: string;
  public isNow: boolean;

  public toString() {
    return (
      " Meeting -  beginTime:" +
      this.beginTime +
      " endTime:" +
      this.endTime +
      " eventId:" +
      this.eventId +
      " callId:" +
      this.callId +
      " isNow:" +
      this.isNow
    );
  }
}

let listner = new TabActions();
listner.onOpenMeeting = (meeting, response) => {
  console.log("Request to open meeting " + meeting);
  response("Opening meeting " + meeting);
  var newMeeting = buildMeeting(meeting);
  storeCurrentMeeting(newMeeting).then(() => {
    setTimeout(
      () => (document.location.href = `https://meet.google.com/${meeting}`),
      DEFAULT_CLICK_TIMEOUT
    );
  });
};

listner.onStartMeeting = response => {
  let startButton = $(JQ_START_NEW_MEETING);
  if (startButton.length > 0) {
    response("Starting session");
    clickElement(startButton, true);
  } else {
    response("Hmmm.. call `close` to stop the current session");
  }
};

listner.onCloseMeeting = response => {
  response("Closing meetings");
  storeCurrentMeeting(new Meeting()).then(() => {
    setTimeout(
      () => (document.location.href = "https://meet.google.com"),
      DEFAULT_CLICK_TIMEOUT
    );
  });
};

async function locateMeeting(): Promise<number> {
  let found = $(JQ_MEETING_BUTTON);
  console.log("Found meetings: " + found.length);
  if (found.length) {
    let meeting = new Meeting();
    meeting.beginTime = parseInt(found.attr("data-begin-time"));
    meeting.endTime = parseInt(found.attr("data-end-time"));
    meeting.eventId = found.attr("data-event-id");
    meeting.callId = found.attr("data-call-id");
    meeting.isNow = found.attr("data-is-now") !== null;

    if (meeting.isNow) {
      var meetingSettings = await settingsLoader.get(new MeetingSettings());
      if (meetingSettings.ignoreOldMeetings.indexOf(meeting.callId) == -1) {
        meetingSettings.ignoreOldMeetings.push(meeting.callId);
        meetingSettings.currentMeeting = meeting;
        await settingsLoader.store(meetingSettings);
        console.log("Connecting to meeting " + meeting.callId);
        clickElement(found);
      } else {
        console.log(`Already loaded [${meeting.callId}] ignoring.`);
      }
    }
  }

  return found.length;
}

async function locateStartMeeting(): Promise<number> {
  let found = $(`${JQ_START_MEETING}`);
  if (found.length) {
    const callId = $("[data-meeting-code]")[0].attributes.getNamedItem(
      "data-meeting-code"
    ).value;
    var newMeeting = buildMeeting(callId);
    listner.sendMeetingStarted(callId);
    await storeCurrentMeeting(newMeeting);
    clickElement(found);
  }

  return found.length;
}

async function locateJoinMeeting(): Promise<number> {
  let found = $(JQ_JOIN_MEETING);
  if (found.length) {
    var meetingSettings = await settingsLoader.get(new MeetingSettings());
    console.log("Found meeting", meetingSettings.currentMeeting);
    if (meetingSettings.currentMeeting.callId) {
      listner.sendMeetingStarted(meetingSettings.currentMeeting.callId);
      console.log("Clicking join meeting.... wait 5 seconds");
      clickElement(found);
    } else {
      console.log("Skip clicking.");
    }
  }
  return found.length;
}

async function locateCloseAddOther() {
  let found = $(JQ_CONTINUE_INVITE);
  if (found.length > 0) {
    clickElement(found);
  } else {
    found = $(JQ_CLOSE_INVITE);
    if (found.length > 0) {
      clickElement(found);
    }
  }
}

async function locateMeetinJoin() {
  // const JQ_ENTER_NAME = "[aria-label='Your name']";
  // const JQ_ASK_TO_JOIN_NAME = "div:contains('Ask to join meeting'):parent[]";

  let found = $(JQ_ENTER_NAME);
  if (found.length > 0) {
    console.log("Add name");
    found.focus();
    found.keypress();
    found.val("Autmated meeting");
    found.attr("aria-disabled", "false");
    found.attr("data-initial-value", "Autmated meeting");
    // pressButton("e");
  }
  found = $(JQ_ASK_TO_JOIN_NAME);
  if (found.length > 0) {
    console.log("Join");
    found.closest("[role='button']").focus();
    found.closest("[role='button']").attr("aria-disabled", "false");
    clickElement(found.closest("[role='button']"));
  }
}

function pressButton(k) {
  var oEvent = document.createEvent("KeyboardEvent");

  // Chromium Hack
  Object.defineProperty(oEvent, "keyCode", {
    get: function() {
      return this.keyCodeVal;
    }
  });
  Object.defineProperty(oEvent, "which", {
    get: function() {
      return this.keyCodeVal;
    }
  });

  if (oEvent.initKeyboardEvent) {
    oEvent.initKeyboardEvent("keydown", true, false, null, k, 1, k, false, k);
  }

  // oEvent.keyCodeVal = k;

  if (oEvent.keyCode !== k) {
    // alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
  }

  document.dispatchEvent(oEvent);
}

async function locateCloseMeeting(): Promise<number> {
  let found = $(JQ_LEAVE_CALL);
  if (found.length) {
    var meetingSettings = await settingsLoader.get(new MeetingSettings());

    console.log("You are in meeting", meetingSettings.currentMeeting.callId);
    if (isDone(new Date(meetingSettings.currentMeeting.endTime))) {
      await storeCurrentMeeting(new Meeting());
      console.log("Clicked disconnect");
      clickElement(found);
      setTimeout(
        () => (document.location.href = "https://meet.google.com"),
        DEFAULT_CLICK_TIMEOUT
      );
    }
  }
  return found.length;
}

async function polling() {
  setTimeout(polling, 1000 * 5);
  var items = await settings.get(new OptionSettings());
  if (items.isEnabled) {
    if ((await locateMeeting()) == 0) {
      await locateJoinMeeting();
      await locateMeetinJoin();

      await locateStartMeeting();

      await locateCloseMeeting();
      await locateCloseAddOther();
    }
  } else {
    console.log("Extention disabled.");
  }
}

function clickElement(
  found: JQuery<HTMLElement>,
  disableColorChange: boolean = false
) {
  if (!disableColorChange) found.css("background-color", SELECT_COLOR);
  setTimeout(() => found.click(), DEFAULT_CLICK_TIMEOUT);
}

async function storeCurrentMeeting(newMeeting: Meeting) {
  var meetingSettings = await settingsLoader.get(new MeetingSettings());
  meetingSettings.currentMeeting = newMeeting;
  await settingsLoader.store(meetingSettings);
}

function buildMeeting(callId: string, minutes: number = 120) {
  var meeting = new Meeting();
  meeting.beginTime = toUnixTime(addMinutes(-1));
  meeting.endTime = toUnixTime(addMinutes(minutes));
  meeting.isNow = true;
  meeting.callId = callId;
  return meeting;
}

function isDone(endTime: Date) {
  let timeSpan = <any>endTime - <any>new Date();
  const isDone = endTime < new Date();
  console.log(
    "Time till the meeting closes:",
    Math.round(timeSpan / 1000 / 60)
  );
  return isDone;
}

var settings = new Settings<OptionSettings>();
var settingsLoader = new Settings<MeetingSettings>();

polling();
listner.listenToBackground();
