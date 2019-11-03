class admin {
  constructor () {

  }

  async get (c) {
    let a = c.service.admin.get(c.param.id);
    if (a === null) {
      c.res.body = c.service.api.ret('ENOTFD');
    } else {
      c.res.body = c.service.api.ret(0, a);
    }
  }

  async list (c) {
    c.res.body = c.service.api.ret(0, c.service.admin.list());
  }

  async create (c) {
    let r = await c.service.admin.create(c.body);
    if (r === -1) {
      c.res.body = c.service.api.ret('EUDEF', '用户已存在');
      return ;
    }

    if (r === false) {
      c.res.body = c.service.api.ret('EWRONG');
      return ;
    }

    c.res.body = c.service.api.ret(0, r);
  }

  async delete (c) {
    let r = await c.service.admin.delete(c.body.username);
    if (r === false) {
      c.res.body = c.service.api.ret('EUDEF', '删除失败，请检查权限');
      return ;
    }
    c.res.body = c.service.api.ret(0);
  }

  async update (c) {

  }

  __mid () {
    return [
      {
        name : 'rootpass',
        path : ['create', 'delete', 'update']
      },
      {
        name : 'adminDataFilter',
        path : ['create', 'update']
      }
    ];
  }

}

module.exports = admin;
