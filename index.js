const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./src/routes/index.route');
//const userFromToken = require('./src/middlewares/user-from-token.middleware');
const Keycloak = require('keycloak-connect');

require('dotenv').config()

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';


var keycloak = new Keycloak({});

const app = express();
app.set('port', PORT);
app.set('env', NODE_ENV);
app.use(bodyParser.json());

//app.use(userFromToken(keycloak));

// app.use(function (req, res, next) {
//   res.header('Content-Type', 'application/json');
//   res.status(404).json({
//     message:req.originalUrl + ' is not found'
//   })
// })
app.use(routes);

app.use(function (err, req, res, next) {
  console.error(err.stack, err, "UN")
  res.header('Content-Type', 'application/json');
  res.status(err.statusCode).json({
    'name': 'error',
    'message': err.message,
    'code': err.name,
    'error': err,
    'data': null
  })
})


app.listen(process.env.PORT).on('listening', () => {
  console.log(`listening on port ${PORT}`);
});