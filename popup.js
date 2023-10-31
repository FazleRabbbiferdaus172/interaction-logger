console.log("This is a popup!")
document.getElementById('startLogging').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'startLogging()'
    });
  });
  
  document.getElementById('stopLogging').addEventListener('click', function() {
    chrome.tabs.executeScript({
      code: 'stopLogging()'
    });
  });
  
  document.getElementById('downloadJson').addEventListener('click', function() {
    chrome.storage.local.get(['interactionData'], function(result) {
      const interactions = result.interactionData || [];
      const jsonContent = JSON.stringify(interactions, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'interaction_data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });
    chrome.storage.local.set({ interactionData: [] });
  });
  