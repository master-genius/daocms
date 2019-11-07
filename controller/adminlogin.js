class adminlogin {
  constructor () {

  }

  //检测是否允许登录
  checkLogStat (c, username) {
    if (c.service.alog[username] === undefined) {
      return [true];
    }
    let u = c.service.alog[username];
    let tm = Date.now();
    //超时30分钟则可以继续登录
    if (u.logTime + 600000 <= tm) {
      delete c.service.alog[username];
      return [true];
    }

    //失败次数超过6次则限制30分钟以后登录
    /**
     * 在正常请求时，由于用户输入时间会有间隔，
     * 会导致cluster模式，并不一定是都是同一个进程处理请求，
     * 比如有4个进程运行，则可能最高可以允许24次尝试。
    */
    if (u.failed >= 6) {
      return [false, '登录失败次数过多，请10分钟之后再试'];
    }
    return true;
  }

  logFailed(c, username) {
    if (c.service.alog[username] === undefined) {
      c.service.alog[username] = {
        logTime: Date.now(),
        failed : 1,
        ip : c.ip,
      };
    } else {
      c.service.alog[username].failed += 1;
    }
  }

  async create (c) {
    let username = c.body.username;
    let passwd = c.body.passwd;

    let u = await c.service.admin.get(username);
    if (u === null) {
      c.res.body = c.service.api.ret('EPERMDENY', '用户名或密码错误');
      return ;
    }

    let st = this.checkLogStat(c, username);
    if (st[0] === false) {
      c.res.body = c.service.api.ret('EUDEF', st[1]);
      return ;
    }

    let r = await c.service.admin.verifyPasswd(username, passwd);
    if (r === false) {
      this.logFailed(c, username);
      c.res.body = c.service.api.ret('EPERMDENY', '用户名或密码错误');
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
