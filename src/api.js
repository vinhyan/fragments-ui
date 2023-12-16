// fragments microservice API, defaults to localhost:8080
const apiUrl =
  'http://ec2con-ecsel-fe0e3qpxfmom-1472472943.us-east-1.elb.amazonaws.com:8080';

/**
 * Given an authenticated user, request all fragments for this user from the
 * fragments microservice (currently only running locally). We expect a user
 * to have an `idToken` attached, so we can send that along with the request.
 */

// GET ALL
export async function getUserFragments(user, expand = false) {
  console.log('Requesting user fragments data...');
  console.log('apiUrl', apiUrl);
  console.log('expand', expand);

  try {
    const res = await fetch(
      `${apiUrl}/v1/fragments${expand ? '?expand=1' : ''}`,
      {
        method: 'GET',
        // mode: 'cors',
        // Generate headers with the proper Authorization bearer token to pass
        headers: user.authorizationHeaders(),
      }
    );
    // console.log('res', res);
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Got user fragments data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call GET /v1/fragment', { err });
  }
}

// GET DATA BY ID
export async function getFragmentDataById(user, fragmentId, ext) {
  // const fragmentId = e.target.id;
  console.log('Getting fragment data by id...');
  try {
    const res = await fetch(
      `${apiUrl}/v1/fragments/${fragmentId}${ext ? `.${ext}` : ''}`,
      {
        method: 'GET',
        // mode: 'cors',
        // Generate headers with the proper Authorization bearer token to pass
        headers: user.authorizationHeaders(),
      }
    );
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    // const data = await res.json();
    console.log('Got user fragments by Id res', res);
    if (res.headers.get('Content-Type').includes('application/json')) {
      const data = await res.json();
      // console.log('*** data', data);
      return JSON.stringify(data);
    }

    return res;
    // } else if (res.headers.get('Content-Type').includes('image')) {
    //   // const objUrl = URL.createObjectURL(await res.blob());
    //   // return objUrl;
    //   return res;
    // } else {
    //   // console.log('res.text()', await res.text());
    //   // return await res.text();
    //   return res;
    // }
  } catch (err) {
    console.error(`Unable to call GET ${apiUrl}/v1/fragments/${fragmentId}`, {
      err,
    });
  }
}

// GET FRAGMENT BY ID
export async function getFragmentById(user, fragmentId) {
  // const fragmentId = e.target.id;
  console.log('Getting fragment by id info...');
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}/info`, {
      method: 'GET',
      // mode: 'no-cors',
      // Generate headers with the proper Authorization bearer token to pass
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('JSON data:', data);
    return data;
  } catch (err) {
    console.error(
      `Unable to call GET ${apiUrl}/v1/fragments/${fragmentId}/info`,
      {
        err,
      }
    );
  }
}

// POST NEW FRAGMENT
export async function submitFragment(user, fragmentData, dataType) {
  console.log('Submitting fragment data...');
  console.log('apiUrl', apiUrl);
  console.log('dataType', dataType);
  console.log('fragmentData', fragmentData);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments`, {
      method: 'POST',
      headers: user.authorizationHeaders(dataType),
      body: fragmentData,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Submitted fragment data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call POST /v1/fragment', { err });
  }
}

// PUT UPDATE FRAGMENT
export async function updateFragmentData(
  user,
  fragmentId,
  fragmentData,
  dataType
) {
  console.log('Updating fragment data...');
  console.log('apiUrl', apiUrl);
  console.log('dataType', dataType);
  console.log('fragmentData', fragmentData);
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'PUT',
      headers: user.authorizationHeaders(dataType),
      body: fragmentData,
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    console.log('Updated fragment data', { data });
    return data;
  } catch (err) {
    console.error('Unable to call PUT /v1/fragment', { err });
  }
}

// DELETE FRAGMENT
export async function deleteFragmentData(user, fragmentId) {
  try {
    const res = await fetch(`${apiUrl}/v1/fragments/${fragmentId}`, {
      method: 'DELETE',
      headers: user.authorizationHeaders(),
    });
    if (!res.ok) {
      throw new Error(`${res.status} ${res.statusText}`);
    }
    // const data = await res.json();
    console.log('Deleted fragment res', { res });
    return res;
  } catch (err) {
    console.error('Unable to call DELETE /v1/fragment', { err });
  }
}

// helper function:
const extToTypeConvert = (ext) => {
  switch (ext) {
    case 'json':
      return 'application/json';
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'md':
      return 'text/markdown';
    case 'html':
      return 'text/html';
    default:
      return 'text/plain';
  }
};
