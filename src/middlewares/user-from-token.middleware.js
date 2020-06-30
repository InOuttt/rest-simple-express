const HttpException = require('http-errors')
const pathToRegExp = require('path-to-regexp');

module.exports = function (keycloak) {
  return function (req, res,  next){
    const match = pathToRegExp('/v1/download/:id');
    
    if (req.path === '/v1/download' || req.path.match(match)) {
      return next();
    }
    console.log(req.header("Authorization"))
    keycloak.grantManager.validateAccessToken(req.header("Authorization"))
      .then(isValidToken => {
        if(!isValidToken) throw new HttpException(401, "invalid token");

        keycloak.grantManager.userInfo(req.header("Authorization"))
          .then( info => {
            req.headers['USER'] = info;
            switch (req.method) {
              case 'POST':
                req.body.created_by = info.sub;
                break;
    
              case 'PATCH':
              case 'PUT':
                req.body.updated_by = info.sub;
                break;
            
              default:
                break;
            }
            next()
          })
          .catch(error => {
            next(new HttpException(401, "invalid token"));
          });
        })
        .catch(err => {
          console.log(err);
          
          next(new HttpException(401, "invalid token"));
        });
  }
}