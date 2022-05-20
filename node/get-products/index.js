var axios = require('axios');

const performGetProducts = async (appId, appSecret, token, base_url) => {
  var headers = { 
    'X-Violet-Token': token,
    'X-Violet-App-Secret': appSecret,
    'X-Violet-App-Id': appId,
    'Content-Type': 'application/json'
  }

  try {
    // Get Products
    console.log(`Getting products`);

    var getProductsResp = await axios({
      method: 'get',
      url: `${base_url}/catalog/products?page=1&size=20&exclude_public=false`,
      headers: headers
    });

    return getProductsResp.data;
  } catch (err) {
      console.error(err);
  }
}

performGetProducts(process.env.APP_ID, process.env.APP_SECRET, process.env.TOKEN, process.env.BASE_URL)
  .then((getProductsResp)=> console.log(`Done!\Get products response:\n${JSON.stringify(getProductsResp, null, 2)}`));
