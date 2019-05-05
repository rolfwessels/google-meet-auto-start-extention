import { IWithResponse } from "./slackSession";

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

  // !listners

  startListner(): any {
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

  sendMessage(message: any, response: IWithResponse): any {
    console.log("Sending message", message);
    chrome.tabs.query({ url: "*://meet.google.com/*" }, tabs => {
      if (tabs != null && tabs.length > 0) {
        const selectedTab = tabs[0];
        if (!selectedTab.active)
          response.reply("Note: that the current meet tab is not active.");
        chrome.tabs.sendMessage(selectedTab.id, message, callBackMessage => {
          response.reply(callBackMessage);
        });
      } else {
        response.reply("Please ensure meeting tab is open.");
      }
    });
  }
}
