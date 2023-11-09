import { Auth, getUser } from './auth';
import { getUserFragments, submitFragment, getFragmentDetail } from './api';

//test onclick

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
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
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

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
                    <div class="select is-rounded">
                      <select name="extension-for-${fragmentId}" id="extension-for-${fragmentId}" ${
                fragment.type !== 'text/markdown' ? 'disabled' : ''
              }>
                        <option value=""></option>
                        <option value="html">.html</option>
                        
                      </select>
                    </div>
                  </td>
                  <td class="is-vcentered">
                    <button class="button get-detail js-modal-trigger" id=${fragmentId} data-target="modal-view-detail">Detail</button>
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

    // const

    // add event listeners to the detail buttons
    // const detailBtns = document.querySelectorAll('.get-detail');
    // detailBtns.forEach((btn) => {
    //   // btn.addEventListener('click', async (e) => await getFragmentDetail(e));
    //   btn.onclick = async (e) => {
    //     const id = e.target.id;
    //     const extSelect = document.querySelector(`#extension-for-${id}`);
    //     await getFragmentDetail(user, id, extSelect.value);
    //   };
    // });
    // MODAL
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
          const id = e.target.id;
          const extSelect = document.querySelector(`#extension-for-${id}`);
          let res = await getFragmentDetail(user, id, extSelect.value);
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
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
