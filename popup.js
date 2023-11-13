console.log("This is a popup!");
document.getElementById("startLogging").addEventListener("click", function () {
  chrome.tabs.executeScript({
    code: "startLogging()",
  });
});

document.getElementById("stopLogging").addEventListener("click", function () {
  chrome.tabs.executeScript({
    code: "stopLogging()",
  });
});

document.getElementById("downloadJson").addEventListener("click", function () {
  chrome.tabs.executeScript({
    code: "downloadLog()",
  });
});

document.getElementById("printLog").addEventListener("click", function () {
  chrome.tabs.executeScript({
    code: "printLogList()",
  });
});

document.getElementById("triggerEvents").addEventListener("click", function () {
  chrome.tabs.executeScript({
    code: "triggerEvents()",
  });
});
