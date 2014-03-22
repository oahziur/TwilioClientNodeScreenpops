var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server)
  , twilio = require('twilio');


server.listen(3000);

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({secret: '1234567890QWERTY'}));

app.get('/', function(req, res) {
  if(req.session.clientName) {
    res.redirect('/client');
  }
  else {
    res.render('index.ejs');
  }
});

function clientRoute(req, res) {
  var capability = new twilio.Capability(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
  );
  if(!req.session.clientName) {
    req.session.clientName = req.body.name;
  }
  capability.allowClientIncoming(req.session.clientName);
  capability.allowClientOutgoing(process.env.TWILIO_APP_SID);
  res.render('client.ejs', {
      token: capability.generate(),
      phone_number: process.env.TWILIO_PHONE_NUMBER
  });
}

app.post('/client', clientRoute);
app.get('/client', clientRoute);

io.sockets.on('connection', function(socket) {
  console.log('socket.io connected');
  socket.on('incoming', function(caller) {
    // some random info for testing
    var details = {
      number: caller,
      name: 'Rui Zhao',
      photo: 'http://fmn.rrfmn.com/fmn060/20140322/1030/original_7ZZH_7e970000030a1191.jpg'
    };
    socket.emit('foundPerson', details);
  });
});

app.post('/incoming', function(req, res) {
  var resp = new twilio.TwimlResponse();

  resp.dial(function() {
    this.client(req.query.clientName);
  });
  res.set('Content-Type', 'text/xml');
  res.send(resp.toString());

});
