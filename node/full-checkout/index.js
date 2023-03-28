var axios = require('axios');
const faker = require('faker');
var qs = require('qs');
const uuid = require('uuid');

const sleep = (milliseconds=500) => new Promise(resolve => setTimeout(resolve, milliseconds));

const performFullCheckout = async (token, refreshToken, appId, appSecret, skus, base_url, email, walletBased=false) => {
  var startDate = new Date();
  console.log(`Starting full checkout - ${startDate}`)

  if(refreshToken) {
    console.log("Acquiring token")
    var refreshTokenResp = await axios({
      method: 'get',
      url: `${base_url}/auth/token`,
      headers: { 
        'X-Violet-Token': refreshToken,
        'X-Violet-App-Secret': appSecret,
        'X-Violet-App-Id': appId,
        'Content-Type': 'application/json'
      }
    });
    token = refreshTokenResp.data.token;
  }

  var headers = { 
    'X-Violet-Token': token,
    'X-Violet-App-Secret': appSecret,
    'X-Violet-App-Id': appId,
    'Content-Type': 'application/json'
  }

  var firstName = faker.name.firstName();
  var lastName = faker.name.lastName();

  var getAddress = (type, withAddress1=true) => {
    return {
      "name": `${firstName} ${lastName}`,
      "address_1": withAddress1? "2815 Elliott Ave": null,
      "address_2": "Unit 100",
      "type": type,
      "city": "Seattle",
      "state": "WA",
      "country": "US",
      "postal_code": "98121"
    }
  }

  try {
    // Create Cart
    var tempDate = new Date();
    console.log(`Creating cart`);

    var emailSplit = email.split(`@`);
    var skus = skus.split(',');
    // # Create Cart
    var appOrderId = uuid.v4();
    var createCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart?app_order_id=${appOrderId}&base_currency=USD&referral_id=123`,
      headers: headers,
      data: (() => {
        if(walletBased){
          return JSON.stringify({"wallet_based_checkout": true, "skus": skus.map((theSku) => {return {"sku_id":theSku, "quantity":1}})});
        } else {
          return JSON.stringify({"wallet_based_checkout": true, "skus": skus.map((theSku) => {return {"sku_id":theSku, "quantity":1}}), "customer": {"first_name":firstName,"last_name":lastName,"email":emailSplit[0] + "+cart" + appOrderId + "@" + emailSplit[1], "shipping_address": getAddress("SHIPPING"), "billing_address":getAddress("BILLING")}});
        }
      })()
    });

    var cartId = createCartResp.data.id;

    console.log(`Created cart: ${cartId} (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

    // Add skus to cart
    tempDate = new Date();
    console.log(`Adding skus to cart: ${skus}`);

    // skus = skus.split(',');
    for(var i = 0; i < skus.length; i++) {
      theSku = skus[i];
      console.log("Adding sku to cart:", theSku);

      // # Add sku To Cart
      var addSkuToCartResp = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/skus?price_cart=false`,
        headers: headers,
        data : JSON.stringify({"sku_id":theSku, "quantity": 1})
      });

      console.log("Added sku to cart: ", theSku);
    }

    console.log(`Added skus to cart. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);
    
    await sleep(2000);

    // Add Customer To Cart
    tempDate = new Date();
    console.log(`Adding customer to cart`);

    if(walletBased) {
      var setIntentBasedCheckoutForCartResp = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/payment`,
        headers: headers,
        data : JSON.stringify({"intent_based_capture": true})
      });

      let data = setIntentBasedCheckoutForCartResp.data;
      // console.log("intent based resp", data); 
      cartData = data;

      // // # Set Shipping Address
      // var setCartShippingAddressResp = await axios({
      //   method: 'post',
      //   url: `${base_url}/checkout/cart/${cartId}/shipping_address?price_cart=false`,
      //   headers: headers,
      //   data : JSON.stringify(getAddress("SHIPPING", false))
      // });

      // # Add Customer To Cart
      var addCustomerToCartResp = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/customer?price_cart=false`,
        headers: headers,
        data : JSON.stringify({"first_name":firstName,"last_name":lastName,"email":emailSplit[0] + "+cart" + cartId + "@" + emailSplit[1],"shipping_address": getAddress("SHIPPING", false), "billing_address":getAddress("BILLING", false)})
      });

      console.log(`Added customer to cart. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

      await sleep(2000);
    }

    // // Set Shipping Address
    // console.log(`Setting shipping address`);

    // var setCartShippingAddressResp = await axios({
    //   method: 'post',
    //   url: `${base_url}/checkout/cart/${cartId}/shipping_address?price_cart=false`,
    //   headers: headers,
    //   data : JSON.stringify(shippingAddress)
    // });

    // console.log(`Set shipping address`);

    // await sleep(2000);

    // // Set Billing Address
    // console.log(`Setting billing address`);

    // var setCartBillingAddressResp = await axios({
    //   method: 'post',
    //   url: `${base_url}/checkout/cart/${cartId}/billing_address?price_cart=false`,
    //   headers: headers,
    //   data : JSON.stringify(billingAddress)
    // });

    // console.log(`Set billing address`);

    // await sleep(2000);

    // Get Available Shipping Methods
    tempDate = new Date();
    console.log(`Getting available shipping methods`);

    var getAvailableShippingMethodsForCartResp = await axios({
      method: 'get',
      url: `${base_url}/checkout/cart/${cartId}/shipping/available`,
      headers: headers
    });

    console.log(`Got available shipping methods. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

    await sleep(2000);

    // Apply Shipping Method
    tempDate = new Date();
    console.log(`Applying shipping method`);

    var setShippingMethodForCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/shipping?price_cart=${walletBased? "true":"false"}`,
      headers: headers,
      data : JSON.stringify(getAvailableShippingMethodsForCartResp.data.map((avl, idx) => [avl.shipping_methods[0]]).flat())
    });

    console.log(`Applied shipping method. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

    await sleep(2000);

    if(walletBased) {
      tempDate = new Date();
      console.log(`Updating payment intent`);
      var updatePayment = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/payment/update`,
        headers: headers
      });

      let data = updatePayment.data;
      // console.log("update payment resp", data); 
      cartData = data;
      console.log(`Updated payment intent. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);
    }


    let tokenResp = (await getPaymentToken())
    let token = tokenResp.data.id;
    // console.log("token", token);

    // # Apply Payment Method
    if(walletBased) {
      // Confirm Payment Intent
      tempDate = new Date();
      console.log(`Confirmed payment intent`);
      try{
        await confirmPaymentIntent(cartData.payment_intent_client_secret, token);
      } catch(err) {
        console.error(err);
      }

      console.log(`Confirmed payment intent'. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

      // # Updated customer in Cart
      tempDate = new Date();
      console.log(`Updated customer in Cart`);

      var addCustomerToCartResp = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/customer?price_cart=false`,
        headers: headers,
        data : JSON.stringify({"first_name":firstName,"last_name":lastName,"email":emailSplit[0] + "+cart" + cartId + "@" + emailSplit[1],"shipping_address": getAddress("SHIPPING"), "billing_address":getAddress("BILLING")})
      });
      console.log(`Updated customer address and price cart for 'Updated customer in Cart'. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);
    } else {
      // Apply Payment Method
      tempDate = new Date();
      console.log(`Applying payment method`);

      var addPaymentMethodForCartResp = await axios({
        method: 'post',
        url: `${base_url}/checkout/cart/${cartId}/payment?price_cart=false`,
        headers: headers,
        // data : JSON.stringify({"card_number":"4242424242424242","card_cvc":987,"card_exp_month":12,"card_exp_year":24})
        data : JSON.stringify({"token":token})
      });
      
      console.log(`Applied payment method. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

      await sleep(2000);
    }


    // Submit Cart
    tempDate = new Date();
    console.log(`Submiting cart`);

    var submitCartResp = await axios({
      method: 'post',
      url: `${base_url}/checkout/cart/${cartId}/submit`,
      headers: headers
    });

    console.log(`Submitted cart. (${(new Date().getTime() - tempDate.getTime()) / 1000} secs)`);

    console.log(`Created and checked out cart: ${cartId}`)

    let endDate = new Date();
    console.log(`Finished full checkout - ${endDate}`)
    console.log(`Total seconds: ${(endDate.getTime() - startDate.getTime()) / 1000}`)

    return cartId;
  } catch (err) {
      console.error(err);
  }  
}

const getPaymentToken = async () => {
  var data = qs.stringify({
    'card[number]': '4242424242424242',
    'card[cvc]': '123',
    'card[exp_month]': '12',
    'card[exp_year]': '2030',
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

const confirmPaymentIntent = async (clientSecret, paymentMethod) => {
  var data = qs.stringify({
    'payment_method_data[card][token]': paymentMethod,
    'payment_method_data[type]': 'card',
    'key': 'pk_test_UHg8oLvg4rrDCbvtqfwTE8qd' 
  });
  var config = {
    method: 'post',
  maxBodyLength: Infinity,
    url: `https://api.stripe.com/v1/payment_intents/${clientSecret.split("_secret")[0]}/confirm?client_secret=${clientSecret}`,
    headers: { 
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    data : data
  };

  return await axios(config);

}

performFullCheckout(process.env.TOKEN, process.env.REFRESH_TOKEN, process.env.APP_ID, process.env.APP_SECRET, process.env.SKUS, process.env.BASE_URL, process.env.EMAIL, (/^(true|t|1|yes|y|on|ok)$/i).test(process.env.WALLET_BASED));
