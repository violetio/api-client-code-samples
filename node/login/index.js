var axios = require('axios');

const performLogin = async (appId, appSecret, base_url, email, password) => {
  var headers = { 
    'X-Violet-App-Secret': appSecret,
    'X-Violet-App-Id': appId,
    'Content-Type': 'application/json'
  }

  try {
    // Authenticate
    console.log(`Authenticating`);

    var loginResp = await axios({
      method: 'post',
      url: `${base_url}/login`,
      headers: headers,
      data : JSON.stringify({"username":email, "password":password})
    });

    return loginResp.data;
  } catch (err) {
      console.error(err);
  }
}

performLogin(process.env.APP_ID, process.env.APP_SECRET, process.env.BASE_URL, process.env.EMAIL, process.env.PASSWORD)
  .then((loginResp)=> console.log(`Done!\nLogin response:\n${JSON.stringify(loginResp, null, 2)}`));
