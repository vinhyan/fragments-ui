import { Auth, getUser } from './auth';
import {
  getUserFragments,
  submitFragment,
  getFragmentDataById,
  getFragmentById,
  updateFragmentData,
  deleteFragmentData,
} from './api';

//test onclick`

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const username = document.querySelector('#username');
  const userGreeting = document.querySelector('#user-greeting');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const dataSubmit = document.querySelector('#data-submit');
  const fileDataSubmit = document.querySelector('#file-data-submit');
  const data = document.querySelector('#data');
  const dataTypeSelect = document.querySelector('#data-type');
  // const fileDataTypeSelect = document.querySelector('#file-data-type');
  const getData = document.querySelector('#get-data');
  const expandCheckbox = document.querySelector('#expand');
  // const fragmentIdList = document.querySelector('#fragment-id-list');
  const showFragmentList = document.querySelector('.show-fragment-list');
  // const getDetailBtn = document.querySelector('#get-detail');
  const fragmentTable = document.querySelector('#fragment-table');
  const fragmentTableBody = document.querySelector('#fragment-table tbody');
  const updateDataSubmit = document.querySelector('#update-data-submit');
  const deleteDataSubmit = document.querySelector('#delete-data-submit');

  // Wire up event handlers to deal with login and logout.
  loginBtn.onclick = () => {
    console.log('Logging in...');
    // Sign-in via the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/advanced/q/platform/js/#identity-pool-federation
    Auth.federatedSignIn(); // to get AWS creds directly from Cognito Federated Identities, should only call this when using OAuth flows or Hosted UI
  };
  logoutBtn.onclick = () => {
    console.log('Logging out...');
    // Sign-out of the Amazon Cognito Hosted UI (requires redirects), see:
    // https://docs.amplify.aws/lib/auth/emailpassword/q/platform/js/#sign-out
    Auth.signOut();
  };

  // See if we're signed in (i.e., we'll have a `user` object)
  const user = await getUser();
  if (!user) {
    // Disable the Logout button
    logoutBtn.disabled = true;
    return;
  }

  // Do an authenticated request to the fragments API server and log the result
  let res = await getUserFragments(user);

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userGreeting.hidden = false;
  username.innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  // Dummy JSON copy button
  const copyBtn = document.querySelector('#copy-btn');
  const dummyJSON = document.querySelector('#dummy-json');
  copyBtn.onclick = async () => {
    try {
      await navigator.clipboard.writeText(dummyJSON.innerText);
      copyBtn.innerText = 'Copied!';
      setTimeout(() => {
        copyBtn.innerText = 'Copy';
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  // Submission Tabs config
  const tabs = document.querySelectorAll('.tabs li');
  const tabContentBoxes = document.querySelectorAll('#tab-content > div');

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((item) => item.classList.remove('is-active'));
      tab.classList.add('is-active');

      const target = tab.dataset.target;
      tabContentBoxes.forEach((box) => {
        if (box.getAttribute('id') === target) {
          box.classList.remove('is-hidden');
        } else {
          box.classList.add('is-hidden');
        }
      });
    });
  });

  // Handle TEXT SUBMIT button
  dataSubmit.onclick = async (e) => {
    const selectedDataType = dataTypeSelect.value;
    console.log('Submitting data...');

    const res = await submitFragment(user, data.value, selectedDataType);
    console.log('>>> res', res);
    if (!res) {
      alert(
        'Error! Your data was not submitted. Please make sure data type is supported'
      );
    } else {
      alert('Text submitted successfully!');
      // location.reload();
    }
  };
  const inputFile = document.querySelector('#user-file-upload');

  // disable submit button until a file is selected
  fileDataSubmit.disabled = true;

  // When a file is selected, show the file name. If not disable the submit button
  inputFile.onchange = (e) => {
    // const input = e.target;
    const fileNameDisplay = document.querySelector('.file-name');

    if (inputFile.files[0]) {
      fileDataSubmit.disabled = false;
      const fileName = inputFile.files[0].name;
      fileNameDisplay.innerText = fileName;
      fileNameDisplay.classList.remove('has-text-danger');
    } else {
      fileDataSubmit.disabled = true;
      fileNameDisplay.innerText = 'No file selected';
      fileNameDisplay.classList.add('has-text-danger');
    }
  };

  // Handle FILE SUBMIT button
  fileDataSubmit.onclick = async (e) => {
    console.log('Submitting file data...');

    const reader = new FileReader();
    reader.onload = async function () {
      const data = this.result;

      const res = await submitFragment(user, data, inputFile.files[0].type);
      console.log(res);
    };
    if (inputFile.files.length > 0) {
      reader.readAsArrayBuffer(inputFile.files[0]);
    }

    if (!res) {
      alert(
        'Error! Your data was not submitted. Please make sure data type is supported'
      );
    } else {
      alert('File submitted successfully!');
      // location.reload();
    }
  };

  // Handle RETRIEVE button
  getData.onclick = async (e) => {
    console.log('Getting data...');
    res = await getUserFragments(user, expandCheckbox.checked);

    //remove any existing list to avoid duplicates
    if (showFragmentList) {
      while (showFragmentList.firstChild) {
        showFragmentList.removeChild(showFragmentList.firstChild);
      }
    }

    // get fragment objects from the response
    const fragments = res.fragments;

    //create a list of fragment rows
    const fragmentRows = `${
      fragments.length > 0
        ? fragments
            .map((fragment) => {
              // let createdDate = new Date(fragment.created);
              let fragmentId = expandCheckbox.checked ? fragment.id : fragment;
              let fragmentType = fragment.type;
              console.log('fragmentType', fragmentType);
              return `<tr>
                  <td >
                    <span><span class="has-text-weight-bold">ID:</span> ${fragmentId}</span><br/>
                    ${
                      expandCheckbox.checked
                        ? `<span><span class="has-text-weight-bold">Created:</span> ${convertDateUS(
                            fragment.created
                          )}</span><br/>
                      <span><span class="has-text-weight-bold">Type:</span> ${
                        fragment.type
                      }</span>`
                        : ''
                    }
                  </td>
                  <td class="is-vcentered">
                  ${
                    !expandCheckbox.checked
                      ? '<em>Not Available</em>'
                      : `<div class="select is-rounded">
                      <select name="extension-for-${fragmentId}" id="extension-for-${fragmentId}">
                        <option value="">default</option>
                        <option value="txt">.txt</option>
                        <option value="md">.md</option>
                        <option value="html">.html</option>
                        <option value="json">.json</option>
                        <option value="png">.png</option>
                        <option value="jpg">.jpg</option>
                        <option value="webp">.webp</option>
                        <option value="gif">.gif</option>
                      </select>
                    </div>`
                  }
                  </td>
                  ${
                    expandCheckbox.checked
                      ? ` 
                  <td class="is-vcentered" id=${fragmentId} data-fragment-type=${fragmentType}>
                    <button class="button get-detail js-modal-trigger" data-target="modal-view-data">
                      View
                    </button>
                    <button class="button has-background-link-light has-text-link	js-edit-modal-trigger" data-target="modal-edit-info">
                      Edit
                    </button>
                    <button class="button is-info is-light js-view-info-modal-trigger" data-target="modal-view-info">
                      More
                    </button>
                     <button class="button has-background-danger-light has-text-danger js-delete-modal-trigger" data-target="modal-delete">
                      Delete
                    </button>
                    
                  </td>`
                      : '<td></td>'
                  }
                 
                </tr>`;
            })
            .join('')
        : '<tr><td>No fragments found</td></tr>'
    }`;
    fragmentTableBody.innerHTML = fragmentRows;

    // add the rows to the list
    // fragmentIdList.innerHTML = fragmentRows;
    // add list to the DOM and show it
    showFragmentList.appendChild(fragmentTable);
    showFragmentList.hidden = false;

    // MODAL FOR VIEW DATA
    // Functions to open and close a modal
    function openModal($el) {
      $el.classList.add('is-active');
    }

    function closeModal($el) {
      $el.classList.remove('is-active');
    }

    function closeAllModals() {
      (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
      });
    }

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-modal-trigger') || []).forEach(
      ($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', async (e) => {
          const id = $trigger.parentNode.id;

          try {
            const extSelect =
              document.querySelector(`#extension-for-${id}`) || false;
            console.log('extSelect', extSelect.value);

            let res = await getFragmentDataById(user, id, extSelect.value);

            if (!res) {
              alert('Error! Extension type is not supported for this fragment');
              return;
            }

            // console.log('res.body', res.body);
            const fragmentDataImg = document.querySelector(
              '#fragment-data-image'
            );

            const fragmentDataDisplay = document.querySelector(
              '#fragment-data-display'
            );
            // console.log('res', res);
            const fragmentType = $trigger.parentNode.dataset.fragmentType;

            if (fragmentType.includes('image')) {
              fragmentDataDisplay.innerText = '';
              fragmentDataDisplay.hidden = true;
              fragmentDataImg.hidden = false;

              const resBlob = await res.blob();

              fragmentDataImg.src = URL.createObjectURL(resBlob);
            } else if (fragmentType.includes('text')) {
              fragmentDataImg.src = '';
              fragmentDataImg.hidden = true;
              fragmentDataDisplay.hidden = false;
              fragmentDataDisplay.innerText = await res.text();
            } else if (fragmentType.includes('json')) {
              fragmentDataImg.src = '';
              fragmentDataImg.hidden = true;
              fragmentDataDisplay.hidden = false;
              fragmentDataDisplay.innerText = res;
            }

            openModal($target);
          } catch (err) {
            console.log(err);
          }
        });
      }
    );

    // Add a click event on various child elements to close the parent modal
    (
      document.querySelectorAll(
        '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button'
      ) || []
    ).forEach(($close) => {
      const $target = $close.closest('.modal');

      $close.addEventListener('click', () => {
        closeModal($target);
      });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        closeAllModals();
      }
    });

    // MODAL FOR VIEW INFO
    // Functions to open and close a modal
    function openModal($el) {
      $el.classList.add('is-active');
    }

    function closeModal($el) {
      $el.classList.remove('is-active');
    }

    function closeAllModals() {
      (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
      });
    }

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-view-info-modal-trigger') || []).forEach(
      ($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', async () => {
          const id = $trigger.parentNode.id;
          const data = await getFragmentById(user, id);
          const fragment = data.fragment;

          const modalCardBody = document.querySelector(
            '#view-info-modal-card-body'
          );

          const fragmentDiv = `<div class="content">
                                  <p><span class="has-text-weight-bold">Fragment ID: </span>${
                                    fragment.id
                                  }</p>
                                  <p><span class="has-text-weight-bold">Owner ID: </span>${
                                    fragment.ownerId
                                  }</p>
                                  <p><span class="has-text-weight-bold">Created: </span>${convertDateUS(
                                    fragment.created
                                  )}</p>
                                  <p><span class="has-text-weight-bold">Updated: </span>${convertDateUS(
                                    fragment.updated
                                  )}</p>
                                  <p><span class="has-text-weight-bold">Type: </span>${
                                    fragment.type
                                  }</p>
                                  <p><span class="has-text-weight-bold">Size: </span>${
                                    fragment.size
                                  }</p>
                              </div>`;
          modalCardBody.innerHTML = fragmentDiv;
          openModal($target);
        });
      }
    );

    // Add a click event on various child elements to close the parent modal
    (
      document.querySelectorAll(
        '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button'
      ) || []
    ).forEach(($close) => {
      const $target = $close.closest('.modal');

      $close.addEventListener('click', () => {
        closeModal($target);
      });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        closeAllModals();
      }
    });

    // MODAL FOR UPDATE DATA
    // Functions to open and close a modal
    function openModal($el) {
      $el.classList.add('is-active');
    }

    function closeModal($el) {
      $el.classList.remove('is-active');
    }

    function closeAllModals() {
      (document.querySelectorAll('.modal') || []).forEach(($modal) => {
        closeModal($modal);
      });
    }

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-edit-modal-trigger') || []).forEach(
      ($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', async (e) => {
          const updatedData = document.querySelector('#update-data');
          const updatedDataType = document.querySelector('#update-data-type');
          const updateFileSection = document.querySelector(
            '#update-file-section'
          );
          const updateTextSection = document.querySelector(
            '#update-text-section'
          );

          const fragmentType = $trigger.parentNode.dataset.fragmentType;

          console.log('fragmentType', fragmentType);

          if (fragmentType.includes('image')) {
            console.log('its an image');
            console.log(updateFileSection);
            updateFileSection.style.display = 'block';
            updateTextSection.style.display = 'none';
          } else {
            updateFileSection.style.display = 'none';
            updateTextSection.style.display = 'block';
          }

          const fragmentId = $trigger.parentNode.id;

          updateDataSubmit.onclick = async (e) => {
            console.log('Updating data...');

            if (fragmentType.includes('image')) {
              const updateInputFile = document.querySelector(
                '#update-file-upload'
              );

              const reader = new FileReader();
              reader.onload = async function () {
                const data = this.result;

                const res = await updateFragmentData(
                  user,
                  fragmentId,
                  data,
                  updateInputFile.files[0].type
                );
                console.log(res);
              };
              if (updateInputFile.files.length > 0) {
                reader.readAsArrayBuffer(updateInputFile.files[0]);
              }

              if (!res) {
                alert(
                  'Error! Your data was not submitted. Please make sure data type is supported'
                );
              }
            } else {
              console.log(
                {
                  user: user,
                  fragmentId: fragmentId,
                  updatedData: updatedData.value,
                  updatedDataType: updatedDataType.value,
                },
                '>>> updateDataSubmit'
              );
              const res = await updateFragmentData(
                user,
                fragmentId,
                updatedData.value,
                updatedDataType.value
              );
              if (!res) {
                alert(
                  'Error! Your data was not submitted. Please make sure data type is not changed'
                );
              }
              updatedData.value = '';
            }
          };

          openModal($target);
        });
      }
    );

    // Add a click event on various child elements to close the parent modal
    (
      document.querySelectorAll(
        '.modal-background, .modal-close, .modal-card-head .delete, .modal-card-foot .button'
      ) || []
    ).forEach(($close) => {
      const $target = $close.closest('.modal');

      $close.addEventListener('click', () => {
        closeModal($target);
      });
    });

    // Add a keyboard event to close all modals
    document.addEventListener('keydown', (event) => {
      if (event.code === 'Escape') {
        closeAllModals();
      }
    });

    // MODAL FOR DELETE

    // Add a click event on buttons to open a specific modal
    (document.querySelectorAll('.js-delete-modal-trigger') || []).forEach(
      ($trigger) => {
        const modal = $trigger.dataset.target;
        const $target = document.getElementById(modal);

        $trigger.addEventListener('click', async (e) => {
          const fragmentId = $trigger.parentNode.id;

          deleteDataSubmit.onclick = async (e) => {
            console.log('Deleteing data...');
            console.log(
              {
                user: user,
                fragmentId: fragmentId,
              },
              '>>> deleteDataSubmit'
            );
            const res = await deleteFragmentData(user, fragmentId);

            if (!res) {
              alert('Error! Your fragment was not deleted. Please try again');
            } else {
              alert('Fragment deleted successfully!');
              location.reload();
            }
          };

          openModal($target);
        });
      }
    );
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);

// helper functions
const convertDateUS = (dateString) => {
  let date = new Date(dateString);
  return date.toLocaleString('en-US');
};
