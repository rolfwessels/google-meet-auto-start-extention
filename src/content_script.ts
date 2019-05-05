import * as $ from "jquery";
import { TabActions } from "./tabActions";
import { addMinutes, toUnixTime } from "./utils";

const JQ_START_NEW_MEETING = "div:contains('Start a new meeting'):parent";
const JQ_MEETING_BUTTON = "[data-call-id]";
const JQ_JOIN_MEETING = "[aria-label='Join meeting. ']";
const JQ_CLOSE_INVITE = "[aria-label='Close']";
const JQ_START_MEETING = "[aria-label='Start meeting. ']";
const JQ_LEAVE_CALL = "[aria-label='Leave call']";
const DEFAULT_CLICK_TIMEOUT = 2000;
const SELECT_COLOR = "#6200EE";

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
let loadedMeeting = new Meeting();
let listner = new TabActions();
listner.onOpenMeeting = (meeting, response) => {
  console.log("Request to open meeting " + meeting);
  response("Opening meeting " + meeting);
  var newMeeting = buildMeeting(meeting);
  store(newMeeting).then(() => {
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
    startButton.click();
  } else {
    response("Hmmm.. call `close` to stop the current session");
  }
};

listner.onCloseMeeting = response => {
  response("Closing meetings");
  store(new Meeting()).then(() => {
    setTimeout(
      () => (document.location.href = "https://meet.google.com"),
      DEFAULT_CLICK_TIMEOUT
    );
  });
};

listner.listenToBackground();

function isDone(endTime: Date) {
  let timeSpan = <any>endTime - <any>new Date();
  const isDone = endTime < new Date();
  console.log(
    "Time till the meeting closes:",
    Math.round(timeSpan / 1000 / 60)
  );
  return isDone;
}

function locateMeeting(): number {
  let found = $(JQ_MEETING_BUTTON);
  console.log("Found meetings: " + found.length);
  found.each((c, element) => {
    let meeting = new Meeting();

    meeting.beginTime = parseInt(
      element.attributes.getNamedItem("data-begin-time").value
    );
    meeting.endTime = parseInt(
      element.attributes.getNamedItem("data-end-time").value
    );
    meeting.eventId = element.attributes.getNamedItem("data-event-id").value;
    meeting.callId = element.attributes.getNamedItem("data-call-id").value;
    meeting.isNow = element.attributes.getNamedItem("data-is-now") !== null;

    if (meeting.isNow) {
      if (loadedMeeting.callId != meeting.callId) {
        console.log("Connecting to meeting " + meeting.callId);
        store(meeting).then(stored => {
          console.log("Saved meeting " + stored.callId);
          $(element).css("background-color", SELECT_COLOR);
          setTimeout(() => element.click(), DEFAULT_CLICK_TIMEOUT);
        });
      } else {
        console.log("Already loading");
      }
    }
  });
  return found.length;
}

function locateStartMeeting(): number {
  let found = $(`${JQ_START_MEETING}`);

  found.each((c, element) => {
    const callId = $("[data-meeting-code]")[0].attributes.getNamedItem(
      "data-meeting-code"
    ).value;
    var newMeeting = buildMeeting(callId);
    listner.sendMeetingStarted(callId);

    store(newMeeting).then(() => {
      $(element).css("background-color", SELECT_COLOR);
      setTimeout(() => element.click(), DEFAULT_CLICK_TIMEOUT);
    });
  });
  return found.length;
}

function buildMeeting(callId: string, minutes: number = 30) {
  var meeting = new Meeting();
  meeting.beginTime = toUnixTime(addMinutes(-1));
  meeting.endTime = toUnixTime(addMinutes(minutes));
  meeting.isNow = true;
  meeting.callId = callId;
  return meeting;
}

function locateJoinMeeting(): number {
  let found = $(JQ_JOIN_MEETING);

  found.each((c, element) => {
    getMeeting().then(loadedMeeting => {
      console.log("Found meeting", loadedMeeting);
      if (loadedMeeting.callId) {
        listner.sendMeetingStarted(loadedMeeting.callId);
        console.log("Clicking join meeting.... wait 5 seconds");
        $(element).css("background-color", SELECT_COLOR);
        setTimeout(() => element.click(), DEFAULT_CLICK_TIMEOUT);
      } else {
        console.log("Skip clicking.");
      }
    });
  });
  return found.length;
}
function locateCloseAddOther() {
  let found = $(JQ_CLOSE_INVITE);
  if (found) {
    found.css("background-color", SELECT_COLOR);
    setTimeout(() => found.click(), DEFAULT_CLICK_TIMEOUT);
  }
}

function locateCloseMeeting(): number {
  let found = $(JQ_LEAVE_CALL);
  found.each((c, element) => {
    getMeeting().then(loadedMeeting => {
      console.log("You are in meeting", loadedMeeting.callId);
      if (isDone(new Date(loadedMeeting.endTime))) {
        store(new Meeting()).then(c => {
          console.log("Clicked disconnect");
          setTimeout(() => element.click(), 1000);
          setTimeout(
            () => (document.location.href = "https://meet.google.com"),
            DEFAULT_CLICK_TIMEOUT
          );
        });
      }
    });
  });
  return found.length;
}

function polling() {
  setTimeout(polling, 1000 * 5);
  chrome.storage.local.get({ isEnabled: true }, function(items: { isEnabled }) {
    if (items.isEnabled) {
      if (locateMeeting() == 0) {
        locateJoinMeeting();
        locateStartMeeting();
        locateCloseMeeting();
        locateCloseAddOther();
      }
    } else {
      console.log("Extention disabled.");
    }
  });
}

function store(value: Meeting): Promise<Meeting> {
  let promise = new Promise<Meeting>(function(resolve, reject) {
    chrome.storage.local.set({ currentMeeting: value }, function() {
      resolve(value);
    });
  });

  return promise;
}

export function getMeeting(): Promise<Meeting> {
  let promise = new Promise<Meeting>(function(resolve, reject) {
    chrome.storage.local.get(
      {
        currentMeeting: new Meeting()
      },
      function(items: { currentMeeting: Meeting }) {
        resolve(items.currentMeeting);
      }
    );
  });
  return promise;
}

polling();
