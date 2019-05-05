import { IWithResponse } from "./slackSession";
import { getMeetingId } from "./utils";

export class MessageParse {
  onStart: () => void;
  onOpen: (room: string) => void;
  onClose: () => void;
  parse(
    text: string,
    response: IWithResponse,
    ignoreHelp: boolean = false
  ): any {
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
    } else if (!ignoreHelp) {
      response.reply(
        "Sorry I can't undestand that command. Options are `start`, `open xxx-xxxx-xxx` , `close`."
      );
    }
  }
  constructor() {}

  private checkAction(text: string, action: string, actionCall: any): boolean {
    const cleanText = text
      .replace(/\<@[A-Z0-9]+\>\s?/g, "")
      .toLowerCase()
      .trim();
    console.log("cleanText", JSON.stringify(cleanText));
    const isAction = cleanText.startsWith(action);
    if (actionCall == null) {
      if (isAction) console.warn(`Please add action for '${action}'.`);
      return false;
    }

    return isAction;
  }
}
