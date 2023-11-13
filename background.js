chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "captureSnapshot") {
        chrome.tabs.captureVisibleTab(null, { format: 'png' }, function(dataUrl) {
            // Create a Blob from the data URL
            const blob = dataURLtoBlob(dataUrl);
        
            // Create a download link
            const downloadLink = document.createElement('a');
            downloadLink.href = window.URL.createObjectURL(blob);
            downloadLink.download = 'snapshot.png';
        
            // Append the link to the document and trigger a click
            document.body.appendChild(downloadLink);
            downloadLink.click();
        
            // Remove the link from the document
            document.body.removeChild(downloadLink);
          });
    }
    return true;
  });