import * as $ from "jquery";

export class OptionSettings {
  isEnabled: boolean;
  slackToken: string;
  slackChannel: string;
  constructor() {
    this.isEnabled = true;
    this.slackToken = "";
    this.slackChannel = "meetingroom";
  }
}

function save_options() {
  const saveSetting = new OptionSettings();
  saveSetting.isEnabled = $("#enabled").prop("checked");
  saveSetting.slackToken = btoa($("#slackToken").val() as string);
  saveSetting.slackChannel = $("#slackChannel").val() as string;

  chrome.storage.local.set(saveSetting, function() {
    // Update status to let user know options were saved.
    var status = $("#status");
    status.show();
    status.text("Options saved.");
    setTimeout(function() {
      status.text("");
      status.hide("slow");
    }, 1500);
  });
}

function restore_options() {
  chrome.storage.local.get(new OptionSettings(), function(
    items: OptionSettings
  ) {
    console.log("Loaded");
    $("#enabled").prop("checked", items.isEnabled);
    $("#slackChannel").val(items.slackChannel);
    $("#slackToken").val(atob(items.slackToken));
  });
}

$("#save").click(save_options);
$("#status").hide();
$(restore_options); // document.addEventListener('DOMContentLoaded', restore_options);
