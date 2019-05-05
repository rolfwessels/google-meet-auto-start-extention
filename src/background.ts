import { readSlackToken, SlackSession, IWithResponse } from "./slackSession";
import { TabActions } from "./tabActions";
import { getMeetingId } from "./utils";
let tabActions = new TabActions();

class MessageParse {
  onStart: () => void;
  onOpen: (room: string) => void;
  onClose: () => void;
  parse(text: string, response: IWithResponse): any {
    if (this.checkAction(text, "start", this.onStart)) {
      this.onStart();
    } else if (this.checkAction(text, "open", this.onOpen)) {
      const meetingId = getMeetingId(text);
      if (meetingId) {
        this.onOpen(meetingId);
      } else {
        response.reply("Please add the meeting room eg `open  xxx-xxxx-xxx`.");
      }
    } else if (this.checkAction(text, "close", this.onClose)) {
      this.onClose();
    } else {
      response.reply(
        "Sorry I can't undestand that command. Options are `start`, `open xxx-xxxx-xxx` , `close`."
      );
    }
  }
  constructor() {}

  private checkAction(text: string, action: string, actionCall: any): boolean {
    const isAction = text
      .toLowerCase()
      .trim()
      .startsWith(action);
    if (actionCall == null) {
      if (isAction) console.warn(`Please add action for '${action}'.`);
      return false;
    }

    return isAction;
  }
}

async function main() {
  var slackToken = await readSlackToken();
  var session = new SlackSession(slackToken);
  session.onMessage(m => {
    if (!m.isBot) {
      let parser = new MessageParse();
      parser.onStart = () => tabActions.startMeeting(m);
      parser.onOpen = room => tabActions.openMeeting(room, m);
      parser.onClose = () => tabActions.closeMeetings(m);
      parser.parse(m.text, m);
    }
  });
  try {
    chrome.tabs.query({ url: "*://meet.google.com/*" }, function(tabs) {
      console.log("tabs", tabs);
    });

    await session.connect();
    console.log("Connected to slack...");
  } catch (e) {
    console.error(e);
  }
}

main();
