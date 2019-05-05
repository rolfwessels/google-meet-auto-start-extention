import * as slack from "slack";

export class SlackSession {
  _defaultToken: { token: string };
  _webSocket: WebSocket;
  _messageCallBack: messageCallBack;
  constructor(token: string) {
    this._defaultToken = { token: token };
  }
  async connect(): Promise<Boolean> {
    var connection = await slack.rtm.connect(this._defaultToken);
    this._webSocket = new WebSocket(connection.url);
    this._webSocket.onmessage = event => {
      var msg = JSON.parse(event.data) as slackMessage;

      if (msg.type == "message" && this._messageCallBack != null) {
        console.log("Recieved", msg);
        this._messageCallBack(new IncommingMessage(msg, this));
      }
    };
    return connection.ok;
  }
  onMessage(text: messageCallBack) {
    this._messageCallBack = text;
  }

  async post(text: string, channel: string): Promise<Boolean> {
    let result = await slack.chat.postMessage({
      ...this._defaultToken,
      text: text,
      channel: channel
    });
    return result.ok;
  }
}

type messageCallBack = (value: IncommingMessage) => void;
type replyDeligate = (text: string) => Promise<Boolean>;

export interface IWithResponse {
  reply: replyDeligate;
}

class IncommingMessage implements IWithResponse {
  _session: SlackSession;
  text: string;
  isBot: Boolean;
  channel: string;
  constructor(slackMessage: slackMessage, session: SlackSession) {
    this.text = slackMessage.text;
    this.channel = slackMessage.channel;
    this.isBot = slackMessage.bot_id != null && slackMessage.subtype != null;
    this._session = session;
  }

  async reply(text: string): Promise<Boolean> {
    let result = await this._session.post(text, this.channel);
    return result;
  }
}

export function readSlackToken(): Promise<string> {
  var readSlackToken = new Promise<string>(function(resolve, reject) {
    chrome.storage.local.get(
      {
        slackToken: ""
      },
      function(items: { slackToken: string }) {
        if (items.slackToken == null || items.slackToken.length < 10) {
          reject("Please add slack token to use slack bot integration.");
        }
        resolve(atob(items.slackToken));
      }
    );
  });
  return readSlackToken;
}
// Get the slack token

interface slackMessage {
  subtype: string;
  client_msg_id: string;
  bot_id: string;
  suppress_notification: boolean;
  type: string;
  text: string;
  user: string;
  team: string;
  channel: string;
  event_ts: string;
  ts: string;
}
