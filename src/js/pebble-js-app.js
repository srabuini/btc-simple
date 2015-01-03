function fetchData() {
  var response;
  var req = new XMLHttpRequest();

  var provider = new Bitstamp();
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

function BtcE(){
  this.url = "https://btc-e.com/api/3/ticker/btc_usd";
  this.name = "BTC-e";
  
  this.data = function(response){
    return {price: response.btc_usd.last, timestamp: response.btc_usd.updated};
  };
}

function Bitstamp(){
  this.url = "https://www.bitstamp.net/api/ticker/";
  this.name = "Bitstamp";
  
  this.data = function(response) {
    return {price: response.last, timestamp: response.timestamp};
  };
}

Pebble.addEventListener("ready",
                        function(e) {
                          console.log("connect! " + e.ready);
                          fetchData();
                          console.log(e.type);
                        });

Pebble.addEventListener("appmessage",
                        function(e) {
                          fetchData();
                          console.log(e.type);
                          console.log(e.payload);
                          console.log("message!");
                        });
