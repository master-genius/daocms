/**
 * admin是基于文件的机制，所以操作都是在对文件进行读写
 */

const funcs = require('../functions');
const fs = require('fs');

var admin = function (options) {
  if (!(this instanceof admin)) {
    return new admin(options);
  }

  this.path = options.path;

  this.adminTable = {};
  this.adminList = {};

  this.roles = [
    'root', 'super', 'inspector', 'editer'
  ];

  this.copyToList = (u) => {
    let cu = {};
    for (let k in u) {
      if (k === 'passwd' || k === 'salt') {
        continue;
      }
      cu[k] = u[k];
    }
    this.adminList[u.username] = cu;
  };

  this.parseAdmin = (fname) => {
    try {
      let u = JSON.parse(
                fs.readFileSync(`${this.path}/${fname}`, {encoding:"utf8"})
              );
      //console.log(u, fname);
      if (u.username + '.json' !== fname) {
        throw new Error('文件和用户不一致');
      }
      //运行时服务，用于登录失败计数。
      u.failed = 0;
      u.failedTime = 0;
      this.adminTable[u.username] = u;
      this.copyToList(u);
    } catch (err) {
      console.log(err.message);
    }
  };

  try {
    let ulist = fs.readdirSync(this.path, {withFileTypes:true});
    for (let i=0; i<ulist.length; i++) {
      if (!ulist[i].isFile() || ulist[i].name.length < 6) {
        continue;
      }
      if (ulist[i].name.substring(ulist[i].name.length-5) !== '.json') {
        continue;
      }
      this.parseAdmin(ulist[i].name);
    }
  } catch (err) {
    console.log(err);
  }
  
};

admin.prototype.aid = function (a = '') {
  return funcs.sha1(`${Date.now()}${a}${Math.random()}`);
};

admin.prototype.get = function (username) {
  if (this.adminTable[username] === undefined) {
    return null;
  }
  return this.adminTable[username];
};

admin.prototype.list = function () {
  return this.adminList;
};

/**
 *    username,passwd,email,role,forbid
 */

admin.prototype.create = async function (u) {
  let fname = `${this.path}/${u.username}.json`;
  try {
    fs.accessSync(fname, fs.constants.F_OK);
    return -1;
  } catch (err) {}

  if (u.role === undefined) {
    u.role = 'editor';
  }

  try {
    u.salt = funcs.makeSalt();
    u.passwd = funcs.sha512(`${u.passwd}${u.salt}`);
    u.id = this.aid(u.username);
    await funcs.writeFile(fname, JSON.stringify(u));
    this.adminTable[u.username] = u;
    this.copyToList(u);
    return u.id;
  } catch (err) {
    return false;
  }
};

admin.prototype.delete = async function (username) {
  if (username === 'root') {
    return false;
  }
  let fname = `${this.path}/${u.username}.json`;
  try {
    fs.accessSync(fname, fs.constants.F_OK);
  } catch (err) {
    return true;
  }

  try {
    let r = await new Promise((rv, rj) => {
      fs.unlink(fname, err => {
        if (err) { rj(err); }
        else { rv(true); }
      });
    });
    delete this.adminTable[username];
    delete this.adminList[username];
    return true;
  } catch (err) {
    return false;
  }

};

admin.prototype.forbid = function (username) {

};

admin.prototype.setRole = async function (username, role) {
  let u = this.get(username);
  if (u === null) {
    return false;
  }
  if (this.roles.indexOf(role) < 0) {
    return false;
  }
  if (u.role === 'root') {
    return false;
  }
  
  u.role = role;
  try {
    await fs.writeFile(`${this.path}/${username}.json`, JSON.stringify(u));
  } catch (err) {
    return false;
  }
  return true;
};

admin.prototype.setPasswd = async function (username, passwd) {
  let u = this.get(username);
  if (u === null) {
    return false;
  }

  u.passwd = funcs.sha512(`${passwd}${u.salt}`);
  try {
    await fs.writeFile(`${this.path}/${username}.json`, JSON.stringify(u));
  } catch (err) {
    return false;
  }
  return true;
};

admin.prototype.verifyPasswd = function (username, passwd) {
  let u = this.adminTable[username];
  if (u === undefined) {
    return false;
  }

  if (funcs.sha512(`${passwd}${u.salt}`) !== u.passwd) {
    return false;
  }
  return true;
};

module.exports = admin;
