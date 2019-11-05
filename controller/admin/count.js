class count {
  constructor () {
    this.mode = 'callback';
  }

  async callback (c) {
    if (c.box.user.role !== 'root') {
      c.query.uid = c.box.user.id;
    }
    let r = await c.service.docs.count(c.query);
    c.res.body = c.service.api.ret(0, r);
  }

}

module.exports = count;
