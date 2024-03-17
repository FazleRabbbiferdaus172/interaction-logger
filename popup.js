const AppStateList = ['idle', 'recording', 'playing'];
const button_ids = ["startLogging", "stopLogging", "downloadJson", "printLog", "clearList", "availableList"];

const button_state_map = {
  'idle': ["startLogging", "downloadJson", "printLog", "clearList", "availableList"],
  'recording': ['stopLogging'],
};

let AppState = 'idle';

function updateUI() {
  let active_list = button_state_map[AppState];
  let disable_list = button_ids.filter(elem => !active_list.includes(elem));
  active_list.forEach(id => {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = false;
    }
  });
  disable_list.forEach(id => {
    const button = document.getElementById(id);
    if (button) {
      button.disabled = true;
    }
  });
}


function clickStartLoging(ev) {
  AppState = 'recording';
  updateUI();
  chrome.storage.local.set({ AppState: AppState });
  chrome.tabs.executeScript({
    code: "startLogging()",
  });
}

document.getElementById("startLogging").addEventListener("click", clickStartLoging);


function clickStopLogging(ev) {
  AppState = 'idle';
  updateUI();
  chrome.storage.local.set({ AppState: AppState });
  chrome.tabs.executeScript({
    code: "stopLogging()",
  });
}

document.getElementById("stopLogging").addEventListener("click", clickStopLogging);

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

document.getElementById("clearList").addEventListener("click", clearList);

document.getElementById('insertNew').addEventListener('click', function() {
  var inputGroup = document.getElementById('uploadSection');
  var toggleIconInsert = document.getElementById('toggleIconInsert');
  if (inputGroup.style.display === 'none') {
    inputGroup.style.display = 'flex';
    toggleIconInsert.innerHTML = `<path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>`;
  } else {
    inputGroup.style.display = 'none';
    toggleIconInsert.innerHTML = `<path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"></path>`;
  }
});

async function triggerEventsPassToContent(ev) {
  let buttonIndex = parseInt(ev.target.parentNode.id.split('_')[1]);
  if (!buttonIndex) {
    buttonIndex = parseInt(ev.target.id.split('_')[1]);
  }
  chrome.tabs.executeScript({
    code: `triggerEvents(${buttonIndex})`,
  }); 
}


function clearList(interactionDataList) {
  chrome.storage.local.set({
    interactionData: [],
    interactionDataList: [],
    interactionDataTitleList: [],
  });  
}

function _listItemGenerator(item, index) {
  const listItemDiv = document.createElement('div');
  listItemDiv.classList.add('row', 'p-1', 'list-group');

  const inputGroupDiv = document.createElement('div');
  inputGroupDiv.classList.add('input-group', 'mb-3');
  const interactionButton = document.createElement('button');
  interactionButton.classList.add('btn', 'btn-outline-success');
  interactionButton.setAttribute('type', 'button');
  interactionButton.setAttribute('id', `interactionButton_${index + 1}`);
  interactionButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-play-circle" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
    <path d="M6.271 5.055a.5.5 0 0 1 .52.038l3.5 2.5a.5.5 0 0 1 0 .814l-3.5 2.5A.5.5 0 0 1 6 10.5v-5a.5.5 0 0 1 .271-.445"/>
  </svg>`;
  interactionButton.addEventListener('click', triggerEventsPassToContent);
  inputGroupDiv.appendChild(interactionButton);

  const inputField = document.createElement('input');
  inputField.setAttribute('type', 'text');
  inputField.classList.add('form-control');
  chrome.storage.local.get(['interactionDataTitleList'], function(result) {
    const interactionDataTitleList = result.interactionDataTitleList || [];
    const placeholderText = interactionDataTitleList[index] ? interactionDataTitleList[index] : `Interaction ${index + 1}`;
    inputField.setAttribute('placeholder', placeholderText);
  });
  inputField.setAttribute('disabled', 'true');
  inputField.setAttribute('id', `eventInput_${index + 1}`);
  inputGroupDiv.appendChild(inputField);

  const editButton = document.createElement('button');
  editButton.classList.add('btn', 'btn-outline-secondary');
  editButton.setAttribute('type', 'button');
  editButton.setAttribute('id', `editButton_${index + 1}`);
  editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pen" viewBox="0 0 16 16">
  <path d="m13.498.795.149-.149a1.207 1.207 0 1 1 1.707 1.708l-.149.148a1.5 1.5 0 0 1-.059 2.059L4.854 14.854a.5.5 0 0 1-.233.131l-4 1a.5.5 0 0 1-.606-.606l1-4a.5.5 0 0 1 .131-.232l9.642-9.642a.5.5 0 0 0-.642.056L6.854 4.854a.5.5 0 1 1-.708-.708L9.44.854A1.5 1.5 0 0 1 11.5.796a1.5 1.5 0 0 1 1.998-.001m-.644.766a.5.5 0 0 0-.707 0L1.95 11.756l-.764 3.057 3.057-.764L14.44 3.854a.5.5 0 0 0 0-.708z"/>
  </svg>`;
  editButton.addEventListener('click', function() {
    inputField.disabled = false;
    editButton.style.display = 'none';
    saveButton.style.display = 'inline-block';
  });
  inputGroupDiv.appendChild(editButton);

  const saveButton = document.createElement('button');
  saveButton.classList.add('btn', 'btn-outline-secondary');
  saveButton.setAttribute('type', 'button');
  saveButton.setAttribute('id', `saveButton_${index + 1}`);
  saveButton.style.display = 'none';
  saveButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-lg" viewBox="0 0 16 16">
  <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425z"/>
</svg>`;
  saveButton.addEventListener('click', function() {
    inputField.disabled = true;
    saveButton.style.display = 'none';
    editButton.style.display = 'inline-block';
    // Update the value in local storage
    updateLocalStorage(index, inputField.value);
  });
  inputGroupDiv.appendChild(saveButton);

  listItemDiv.appendChild(inputGroupDiv);
  availableList.appendChild(listItemDiv);
}

// Function to update value in local storage
function updateLocalStorage(index, value) {
  chrome.storage.local.get(['interactionDataTitleList'], function(result) {
    const interactionDataTitleList = result.interactionDataTitleList || [];
    interactionDataTitleList[index] = value;
    chrome.storage.local.set({ interactionDataTitleList: interactionDataTitleList }, function() {
      console.log(`Value updated in local storage at index ${index}: ${value}`);
    });
  });
}

function updateAvailableList(interactionDataList) {
  const availableList = document.getElementById('availableList');
  availableList.innerHTML = ''; // Clear the existing list
  
  // Iterate over the interactionDataList and create list items
  interactionDataList.forEach((item, index) => {
    _listItemGenerator(item, index);
  });
}

document.getElementById("uploadButton").addEventListener("click", function() {
  const jsonData = document.getElementById("jsonTextInput").value.trim();
  if (!jsonData) {
    console.error("No JSON data entered.");
    return;
  }

  try {
    const parsedData = JSON.parse(jsonData);
    // Append parsedData to interactionDataList
    chrome.storage.local.get(["interactionDataList"], function(result) {
      let interactionDataList = result.interactionDataList || [];
      parsedData.forEach(entry => {
        if (entry.interactionData) {
            interactionDataList.push(entry.interactionData); }
    });
      chrome.storage.local.set({ interactionDataList: interactionDataList }, function() {
        console.log("Data appended to interactionDataList:", parsedData);
      });
    });

    // Append title to interactionDataTitleList
    chrome.storage.local.get(["interactionDataTitleList"], function(result) {
      let interactionDataTitleList = result.interactionDataTitleList || [];
      const title = "Custom Title"; // Replace with user-defined title if available
      parsedData.forEach(entry => {
          if (entry.interactionDataTitle) {
                interactionDataTitleList.push(entry.interactionDataTitle);
            }
    });    
      chrome.storage.local.set({ interactionDataTitleList: interactionDataTitleList }, function() {
        console.log("Title appended to interactionDataTitleList:", title);
      });
    });

  } catch (error) {
    console.error("Invalid JSON format:", error.message);
  }
  jsonData.value = false;
});

// Listen for changes to the storage
chrome.storage.local.get(["interactionDataList"], function (result) {
  const interactionDataList = result.interactionDataList || [];
  updateAvailableList(interactionDataList);
});

chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (changes.interactionDataList) {
    const newInteractionDataList = changes.interactionDataList.newValue || [];
    updateAvailableList(newInteractionDataList);
  }
});

chrome.storage.local.get(['AppState'], function(result) {
  AppState = result.AppState || 'idle';
  // Update UI based on retrieved recording state
  updateUI();
});