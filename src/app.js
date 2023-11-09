import { Auth, getUser } from './auth';
import {
  getUserFragments,
  submitFragment,
  getFragmentDataById,
  getFragmentById,
  s,
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
  const data = document.querySelector('#data');
  const dataTypeSelect = document.querySelector('#data-type');
  const getData = document.querySelector('#get-data');
  const expandCheckbox = document.querySelector('#expand');
  // const fragmentIdList = document.querySelector('#fragment-id-list');
  const showFragmentList = document.querySelector('.show-fragment-list');
  const getDetailBtn = document.querySelector('#get-detail');
  const fragmentTable = document.querySelector('#fragment-table');
  const fragmentTableBody = document.querySelector('#fragment-table tbody');

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

  dataSubmit.onclick = (e) => {
    const selectedDataType = dataTypeSelect.value;
    console.log('Submitting data...');
    // console.log(data.value);
    // console.log('selectedDataType', selectedDataType);
    submitFragment(user, data.value, selectedDataType);
    init();
  };

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
              let createdDate = new Date(fragment.created);
              let fragmentId = expandCheckbox.checked ? fragment.id : fragment;
              return `<tr>
                  <td >
                    <span><span class="has-text-weight-bold">ID:</span> ${fragmentId}</span><br/>
                    ${
                      expandCheckbox.checked
                        ? `<span><span class="has-text-weight-bold">Created:</span> ${createdDate.toLocaleDateString(
                            'en-US'
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
                      <select name="extension-for-${fragmentId}" id="extension-for-${fragmentId}" ${
                          fragment.type !== 'text/markdown' ? 'disabled' : ''
                        }>
                        <option value="">default</option>
                        <option value="html">.html</option>
                        
                      </select>
                    </div>`
                  }
                  </td>
                  <td class="is-vcentered" id=${fragmentId}>
                    <button class="button get-detail js-modal-trigger" data-target="modal-view-data">
                      View Data
                    </button>
                    <button class="button is-info is-light js-view-info-modal-trigger" data-target="modal-view-info">
                      Info
                    </button>
                  </td>
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

          const extSelect =
            document.querySelector(`#extension-for-${id}`) || false;
          let res = await getFragmentDataById(user, id, extSelect.value);
          const fragmentDataDisplay = document.querySelector(
            '#fragment-data-display'
          );
          fragmentDataDisplay.innerText = res;
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
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);

// helper functions
const convertDateUS = (dateString) => {
  let date = new Date(dateString);
  return date.toLocaleDateString('en-US');
};
