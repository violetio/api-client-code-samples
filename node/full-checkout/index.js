var axios = require('axios');
const faker = require('faker');
var qs = require('qs');

const sleep = (milliseconds=500) => new Promise(resolve => setTimeout(resolve, milliseconds));

const performFullCheckout = async (token, appId, appSecret, skus, base_url, email) => {
  var headers = { 
    'X-Violet-Token': token,
    'X-Violet-App-Secret': appSecret,
    'X-Violet-App-Id': appId,
    'Content-Type': 'application/json'
  }

  var firstName = faker.name.firstName();
  var lastName = faker.name.lastName();

  var getAddress = (type) => {
    return {"address_1":"123 Main St NEWS","city":"Seattle","country":"US","postal_code":"98121","state":"WA","type":type,"name":`${firstName} ${lastName}`,"phone":"202-555-0125","address_2":""};
  }

  var shippingAddress = getAddress("SHIPPING");
  var billingAddress = getAddress("BILLING");

  try {
    // Create Cart
    console.log(`Creating cart`);

    var createCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart?app_order_id=1&base_currency=USD&referral_id=123`,
      headers: headers
    });

    var cartId = createCartResp.data.id;

    console.log(`Created cart: ${cartId}`);

    // Add skus to cart
    console.log(`Adding skus to cart: ${skus}`);

    skus = skus.split(',');
    for(var i = 0; i < skus.length; i++) {
      theSku = skus[i];
      console.log("Adding sku to cart:", theSku);

      // # Add sku To Cart
      var addSkuToCartResp = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/skus?price_cart=false`,
        headers: headers,
        data : JSON.stringify({"sku_id":theSku})
      });

      console.log("Added sku to cart: ", theSku);
    }

    console.log(`Added skus to cart.`);
    
    await sleep(2000);

    // Add Customer To Cart
    console.log(`Adding customer to cart`);

    var addCustomerToCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/customer?price_cart=false`,
      headers: headers,
      data : JSON.stringify({"first_name":firstName,"last_name":lastName,"email":email})
    });

    console.log(`Added customer to cart`);

    await sleep(2000);

    // Set Shipping Address
    console.log(`Setting shipping address`);

    var setCartShippingAddressResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/shipping_address?price_cart=false`,
      headers: headers,
      data : JSON.stringify(shippingAddress)
    });

    console.log(`Set shipping address`);

    await sleep(2000);

    // Set Billing Address
    console.log(`Setting billing address`);

    var setCartBillingAddressResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/billing_address?price_cart=false`,
      headers: headers,
      data : JSON.stringify(billingAddress)
    });

    console.log(`Set billing address`);

    await sleep(2000);

    // Get Available Shipping Methods
    console.log(`Getting available shipping methods`);

    var getAvailableShippingMethodsForCartResp = await axios({
      method: 'get',
      url: `${base_url}/checkout/cart/${cartId}/shipping/available`,
      headers: headers
    });

    console.log(`Got available shipping methods`);

    await sleep(2000);

    // Apply Shipping Method
    console.log(`Applying shipping method`);

    var setShippingMethodForCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/shipping?price_cart=false`,
      headers: headers,
      data : JSON.stringify(getAvailableShippingMethodsForCartResp.data.map((avl, idx) => [avl.shipping_methods[0]]).flat())
    });

    console.log(`Applied shipping method`);

    await sleep(2000);

    // Apply Payment Method
    console.log(`Applying payment method`);

    var addPaymentMethodForCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/payment?price_cart=false`,
      headers: headers,
      data : JSON.stringify({"card_number":"4242424242424242","card_cvc":987,"card_exp_month":12,"card_exp_year":22}) /*JSON.stringify({"token":token})*/
    });

    console.log(`Applied payment method`);

    await sleep(2000);

    // Submit Cart
    console.log(`Submiting cart`);

    var submitCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/submit`,
      headers: headers
    });

    console.log(`Submitted cart`);

    return cartId;
  } catch (err) {
      console.error(err);
  }
}

const getPaymentToken = async () => {
  var data = qs.stringify({
    'card[number]': '4242424242424242',
    'card[cvc]': '123',
    'card[exp_month]': '04',
    'card[exp_year]': '2022',
    'card[address_zip]': '98104',
    'card[currency]': 'usd',
    'time_on_page': '3',
    'guid': 'NA',
    'muid': 'NA',
    'sid': 'NA',
    'key': 'pk_test_UHg8oLvg4rrDCbvtqfwTE8qd',
    'payment_user_agent': 'asdf'
  });
  var config = {
    method: 'post',
    url: 'https://api.stripe.com/v1/tokens',
    headers: { 
      'authority': 'api.stripe.com', 
      'accept': 'application/json', 
      'accept-language': 'en-US', 
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36', 
      'content-type': 'application/x-www-form-urlencoded'
    },
    data : data
  };

  return await axios(config);
}

performFullCheckout(process.env.TOKEN, process.env.APP_ID, process.env.APP_SECRET, process.env.SKUS, process.env.BASE_URL, process.env.EMAIL)
  .then((cartId)=> console.log(`Done!\nCreated and checked out cart: ${cartId}`));
