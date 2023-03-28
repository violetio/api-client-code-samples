# full-checkout

Full checkout sample with all required steps.

## Setup

```
npm install
```

## Running code

```
APP_ID=[APP ID] \
APP_SECRET=[APP SECRET] \
TOKEN=[TOKEN] \
REFRESH_TOKEN=[REFRESH TOKEN] \
SKUS=[PRODUCTS SKUS] \
BASE_URL=[BASE URL] \
EMAIL=[EMAIL] \
WALLET_BASED=[true|false] \
node index.js
```

## Sample

```
APP_ID=[YOUR APP ID FROM MYVIOLET] \
APP_SECRET=[YOUR APP SECRET FROM MYVIOLET] \
TOKEN=[YOUR AUTHENTICATED TOKEN] \
REFRESH_TOKEN==[YOUR AUTHENTICATED REFRESH TOKEN] \
SKUS=31355,31356 \
BASE_URL=https://sandbox-api.violet.io/v1 \
EMAIL=[VALID TEST EMAIL] \
WALLET_BASED=true \
node index.js
```