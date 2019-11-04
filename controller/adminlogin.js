class adminlogin {
  constructor () {

  }

  async create (c) {
    let username = c.body.username;
    let passwd = c.body.passwd;

    let u = c.service.admin.get(username);
    if (u === null) {
      c.res.body = c.service.api.ret('EPERMDENY');
      return ;
    }

    //检测是否超过最大登录次数限制

    let r = c.service.admin.verifyPasswd(username, passwd);
    if (r === false) {
      c.res.body = c.service.api.ret('EPERMDENY');
      return ;
    }

    let expires = 7200000; //60minutes
    let userinfo = {
        id        : u.id,
        username  : u.username,
        email     : u.email,
        expires   : expires,
        ip        : c.ip,
        role      : u.role
    };

    let token = c.service.user.userToken(userinfo, c.service.adminkey);
    c.res.body = c.service.api.ret(0, {
      token : token,
      user  : {
        username  : u.username,
        role      : u.role,
        expires   : expires,
      }
    });
  }

}

module.exports = adminlogin;
