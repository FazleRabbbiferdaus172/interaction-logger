let interactionData = [];
console.log("This is a popup!")
function captureInteraction(type, target) {
  interactionData.push({
    type: type,
    target: target.tagName
  });
}


function stopLogging() {
  chrome.storage.local.set({ interactionData: interactionData });
  interactionData = [];
  document.removeEventListener('click', function(event) {
    captureInteraction('click', event.target);
  });
  
  document.removeEventListener('keydown', function(event) {
    captureInteraction('keydown', event.key);
  });
}

function startLogging() {
    chrome.storage.local.set({ interactionData: [] });
    document.addEventListener('click', function(event) {
        captureInteraction('click', event.target);
      });
      
      document.addEventListener('keydown', function(event) {
        captureInteraction('keydown', event.key);
      });
    console.log('started')
  }
  
