const funcs = require('./functions');
const fs = require('fs');

/**
 * 用户角色分为：root、editer、inspector、super
 * editer可以编辑并管理内容，但是不能删除或更改其他editer的内容
 * inspector是审核员，可以设置某些内容是否可见。
 * super是inspector和editor的结合。
 */

/**
 * 
 * @param {*} u 
 * 
 */

function userTemp (u) {
  return `{
    "passwd" : "${u.passwd}",
    "role" : "${u.role}",
    "email" : "${u.email}",
  }`;
}

var salt = funcs.makeSalt();

var u = {
  passwd : funcs.sha512(`wy1001!${salt}`),
  email : '3360302190@qq.com',
  role : 'root',
  salt : salt,
  id : '1',
  username : 'root'
}

fs.writeFileSync('admin/root.json', JSON.stringify(u), {encoding:'utf8'});

/* for (let i=2; i < process.argv.length; i++) {
  switch (process.argv[i]) {
    case '--user':
    case '--passwd':
    case '--email':
  }
}
 */