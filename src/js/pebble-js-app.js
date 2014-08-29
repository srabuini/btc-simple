function fetchData() {
  var response;
  var req = new XMLHttpRequest();
  req.open('GET', "https://www.bitstamp.net/api/ticker/");
  req.onload = function(e) {
    if (req.readyState == 4) {
      if(req.status == 200) {
        response = JSON.parse(req.responseText);
        var price;
        if (response) {
          price = response.last;
          console.log(price);
          Pebble.sendAppMessage({
            "price":'$ ' + price});
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
