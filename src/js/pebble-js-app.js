var DEFAULT_CONFIGURATION = {"provider": "bitstamp"};

function fetchData() {
  var response;
  var req = new XMLHttpRequest();

  var provider = getProvider();
  console.log(provider.url);
  req.open('GET', provider.url);

  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        response = JSON.parse(req.responseText);
        var price, timestamp;
        if (response) {
          var data = provider.data(response);
          price = data.price;
          timestamp = data.timestamp;
          var date = new Date(timestamp * 1000);
          var hours = date.getHours();
          var minutes = date.getMinutes();
          minutes = (minutes < 10 ? '0' + minutes : minutes);
          timestamp = hours + ':' + minutes;
          console.log(price);
          console.log(timestamp);
          Pebble.sendAppMessage({
            "price":'$' + price,
            "timestamp": provider.name + ':' + timestamp
          });
        }
      } else {
        console.log("Error");
      }
    }
  };
  req.send(null);
}

function BtcE() {
  this.url = "https://btc-e.com/api/3/ticker/btc_usd";
  this.name = "BTC-e";
  this.data = function(response) {
    return {price: response.btc_usd.last, timestamp: response.btc_usd.updated};
  };
}

function Bitstamp() {
  this.url = "https://www.bitstamp.net/api/ticker/";
  this.name = "Bitstamp";
  this.data = function(response) {
    return {price: response.last, timestamp: response.timestamp};
  };
}

function Coindesk() {
  this.url = "http://api.coindesk.com/v1/bpi/currentprice.json";
  this.name = "Coindesk";
  this.data = function(response) {
    return {price: response.bpi.USD.rate_float, timestamp: Date.parse(response.time.updatedISO) / 1000};
  };
}

function Bitfinex() {
  this.url = "https://api.bitfinex.com/v1/pubticker/btcusd";
  this.name = "Bitfinex";
  this.data = function(response) {
    return {price: response.last_price, timestamp: response.timestamp};
  };
}

function OKCoin() {
  this.url = "https://www.okcoin.com/api/v1/ticker.do?symbol=btc_usd";
  this.name = "OkCoin";
  this.data = function(response) {
    return {price: response.ticker.last, timestamp: response.date};
  };
}

function BitcoinAverage() {
  this.url = "https://api.bitcoinaverage.com/ticker/USD/";
  this.name = 'BitcoinAverage';
  this.data = function(response) {
    return {price: response.last, timestamp: Date.parse(response.timestamp)};
  };
}

function getConfiguration() {
  var configuration = localStorage.getItem("configuration");
  if (configuration) {
    try {
      return JSON.parse(configuration);
    } catch(e) {
      console.log("WARN: error parsing configuration from localstorage: " + e);
      return DEFAULT_CONFIGURATION;
    }
  } else {
    return DEFAULT_CONFIGURATION;
  }
}

function getProvider() {
  var configuration = getConfiguration();
  var provider = configuration.provider;
  var objProvider;

  console.log("Getting provider...");
  console.log(getConfiguration());
  console.log(provider);

  switch (provider) {
    case "bitstamp":
      objProvider = new Bitstamp();
      break;
    case "btc_e":
      objProvider = new BtcE();
      break;
    case "coindesk":
      objProvider = new Coindesk();
      break;
    case 'bitcoinaverage':
      objProvider = new BitcoinAverage();
      break;
    case "bitfinex":
      objProvider = new Bitfinex();
      break;
    case "okcoin":
      objProvider = new OKCoin();
      break;
    default:
      objProvider = new Bitstamp();
  }

  return objProvider;
}

Pebble.addEventListener("ready", function(e) {
  console.log("connect! " + e.ready);
  fetchData();
  console.log(e.type);
});

Pebble.addEventListener("appmessage", function(e) {
  fetchData();
  console.log(e.type);
  console.log(e.payload);
  console.log("message!");
});

Pebble.addEventListener("showConfiguration", function(e) {
  Pebble.openURL("http://wasabitlabs.com/en/btc-simple");
});

Pebble.addEventListener("webviewclosed", function(e) {
  var configuration = JSON.parse(decodeURIComponent(e.response));
  localStorage.setItem("configuration", JSON.stringify(configuration));
  console.log("Configuration window returned: " + JSON.stringify(configuration));
  fetchData();
});
