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

// document.getElementById("triggerEvents").addEventListener("click", triggerEventsPassToContent);

// document.getElementById("captureSnapShot").addEventListener("click", function () {
//   chrome.tabs.executeScript({
//     code: "captureSnapShot()",
//   });
// });

// async function getValueFromStorage(key) {
//   return new Promise((resolve, reject) => {
//     chrome.storage.local.get(key, function (result) {
//       if (chrome.runtime.lastError) {
//         reject(chrome.runtime.lastError);
//       } else {
//         resolve(result[key]);
//       }
//     });
//   });
// }


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
  interactionButton.innerHTML = '<i class="bi bi-play-circle"></i>';
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
  editButton.innerHTML = '<i class="bi bi-pen"></i>';
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
  saveButton.innerHTML = '<i class="bi bi-check"></i>';
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
  console.log('hi updateAvailableList');
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