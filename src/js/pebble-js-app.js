function fetchData() {
  var response;
  var req = new XMLHttpRequest();
  req.open('GET', "https://www.bitstamp.net/api/ticker/");
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        response = JSON.parse(req.responseText);
        var price, timestamp;
        if (response) {
          price = response.last;
          timestamp = response.timestamp;
          var date = new Date(timestamp * 1000);
          var hours = date.getHours();
          var minutes = date.getMinutes();
          minutes = (minutes < 10 ? '0' + minutes : minutes)
          timestamp = hours + ':' + minutes;
          console.log(price);
          console.log(timestamp);
          Pebble.sendAppMessage({
            "price":'$' + price,
            "timestamp": timestamp
          });
        }
      } else {
        console.log("Error");
      }
    }
  };
  req.send(null);
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
