import { IWithResponse } from "./slackSession";
import { OptionSettings } from "./options";

export class TabActions {
  startMeeting(response: IWithResponse): void {
    this.sendMessage({ action: "start-meeting" }, response);
  }
  openMeeting(meetingRoom: string, response: IWithResponse) {
    this.sendMessage({ action: "open-meeting", meetingRoom }, response);
  }
  closeMeetings(response: IWithResponse): void {
    this.sendMessage({ action: "close-meeting" }, response);
  }

  sendMeetingStarted(meetingRoom: string) {
    chrome.runtime.sendMessage(
      { action: "meeting-started", meetingRoom },
      function(response) {
        console.log("response from background: ", response);
      }
    );
  }

  optionsChanged(before: OptionSettings, after: OptionSettings): any {
    if (
      before.slackChannel != after.slackChannel ||
      before.slackToken != after.slackToken
    ) {
      chrome.runtime.sendMessage({ action: "settings-updated" }, function(
        response
      ) {
        console.log("response from background: ", response);
      });
    }
  }

  // listners

  onCloseMeeting(sendResponse: (response?: any) => void): any {
    throw new Error("Method not implemented.");
  }
  onStartMeeting(sendResponse: (response?: any) => void): any {
    throw new Error("Method not implemented.");
  }
  onOpenMeeting(meetingRoom: any, sendResponse: (response?: any) => void): any {
    throw new Error("Method not implemented.");
  }
  onMeetingStarted(meetingRoom: any): any {
    console.log(`Started meeting room: ${meetingRoom}`);
  }

  onSettingsUpdated(msg: any): any {
    console.log(`Settings updated`, msg);
  }

  // subscribe
  listenToContentScript(): any {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action != null) {
        console.log("Message received", msg);
        if (msg.action == "meeting-started") {
          this.onMeetingStarted(msg.meetingRoom);

          sendResponse("done");
        }
        if (msg.action == "settings-updated") {
          this.onSettingsUpdated(msg);

          sendResponse("done");
        }
      }
    });
  }

  listenToBackground(): any {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action != null) {
        console.log("Message received", msg);
        if (msg.action == "start-meeting") {
          this.onStartMeeting(sendResponse);
        }
        if (msg.action == "open-meeting") {
          this.onOpenMeeting(msg.meetingRoom, sendResponse);
        }
        if (msg.action == "close-meeting") {
          this.onCloseMeeting(sendResponse);
        }
      }
    });
  }

  private sendMessage(message: any, response: IWithResponse): any {
    console.log("Sending message", message);
    chrome.tabs.query({ url: "*://meet.google.com/*" }, tabs => {
      if (tabs != null && tabs.length > 0) {
        const selectedTab = tabs[0];
        if (!selectedTab.active)
          response.reply("Note: that the current meet tab is not active.");
        chrome.tabs.sendMessage(selectedTab.id, message, callBackMessage => {
          if (chrome.runtime.lastError != null) {
            console.error(
              "No response from tab. Reloading",
              chrome.runtime.lastError
            );
            chrome.tabs.reload(selectedTab.id);
            response.reply(":angry: Error contacting tab. Please try again.");
          } else {
            response.reply(callBackMessage);
          }
        });
      } else {
        response.reply("Please ensure meeting tab is open.");
      }
    });
  }
}
