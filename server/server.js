const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jwt-simple");
const moment = require("moment");
const tokens = require("../auth/tokens");
const fs = require("fs");

const users = require("../db/users.json");
const tweets = require("../db/tweets.json");

const port = 3333;
const app = express();

// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "pug");

const jwtAttributes = {
  SECRET: "This_is_the_best_secret_ever",
  HEADER: "super-tweeter-token"
};

// middleware
const auth = function(req, res) {
  if (req.body) {
    const user = validateUser(req.body.username, req.body.password);
    if (user) {
      const expires = moment()
        .add(10000, "seconds")
        .valueOf();

      const payload = {
        exp: expires,
        name: user.username
      };

      const token = jwt.encode(payload, jwtAttributes.SECRET);
      tokens.add(token, payload);

      res.json({ token });
    } else {
      res.sendStatus(401);
    }
  } else {
    res.sendStatus(401);
  }
};

// user validation
function validateUser(username, password) {
  const user = users.find(user => {
    return user.username === username && user.password === password;
  });
  return user;
}

app.get("/", (req, res) => {
  res.render("index", { tweets: tweets });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", auth, (req, res) => {
  res.send({ token: token });
});

// middleware
const validate = function (req, res, next) {
  const { HEADER, SECRET } = jwtAttributes;

  const token = req.headers[HEADER];

  if (!token) {
    res.statusMessage = 'Unauthorized: Token not found';
    res.sendStatus('401').end();
  } else {
    try {
      jwt.decode(token, SECRET);
    } catch(e) {
      res.statusMessage = 'Unauthorized: Invalid token';
      res.sendStatus('401');
      return;
    }
    
    if (!tokens.isValid(token)) {
      res.statusMessage = 'Unauthorized : Token is either invalid or expired';
      res.sendStatus('401');
      return;
    }
    next(); 
  }
};

app.post('/tweet', validate, (req, res) => {
  
  var tweet = {
    id: tweets.length + 1,
    title: req.body.title,
    body: req.body.body
  }

  tweets.push(tweet);

  fs.writeFile("./db/tweets.json", JSON.stringify(tweets), (err) => {
    if(err) {
      console.error(err);
      return;
    }
    console.log("tweet added");
  })
});

app.listen(port, function() {
  console.log("Server listening on port " + port);
});
