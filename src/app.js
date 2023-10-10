import { Auth, getUser } from './auth';
import { getUserFragments, submitFragment } from './api';

async function init() {
  // Get our UI elements
  const userSection = document.querySelector('#user');
  const loginBtn = document.querySelector('#login');
  const logoutBtn = document.querySelector('#logout');
  const dataSubmit = document.querySelector('#data-submit');
  const data = document.querySelector('#data');

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
  await getUserFragments(user);

  // Log the user info for debugging purposes
  console.log({ user });

  // Update the UI to welcome the user
  userSection.hidden = false;

  // Show the user's username
  userSection.querySelector('.username').innerText = user.username;

  // Disable the Login button
  loginBtn.disabled = true;

  dataSubmit.onclick = (e) => {
    console.log('Submitting data...');
    console.log(data.value);
    submitFragment(user, data.value);
  };
}

// Wait for the DOM to be ready, then start the app
addEventListener('DOMContentLoaded', init);
