import * as $ from "jquery";

function save_options() {
  var isEnabled = $("#enabled").prop("checked");
  var slackToken = btoa($("#slackToken").val() as string);
  var slackChannel = $("#slackChannel").val() as string;

  chrome.storage.local.set(
    {
      isEnabled: isEnabled,
      slackToken: slackToken,
      slackChannel: slackChannel
    },
    function() {
      // Update status to let user know options were saved.
      var status = $("#status");
      status.show();
      status.text("Options saved.");
      setTimeout(function() {
        status.text("");
        status.hide("slow");
      }, 1500);
    }
  );
}

function restore_options() {
  chrome.storage.local.get(
    {
      isEnabled: true,
      slackToken: "",
      slackChannel: "meetingroom"
    },
    function(items: { isEnabled; slackToken; slackChannel }) {
      console.log("Loaded");
      $("#enabled").prop("checked", items.isEnabled);
      $("#slackChannel").val(items.slackChannel);
      $("#slackToken").val(atob(items.slackToken));
    }
  );
}

$("#save").click(save_options);
$("#status").hide();
$(restore_options); // document.addEventListener('DOMContentLoaded', restore_options);
