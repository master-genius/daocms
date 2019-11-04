module.exports = async (c, next) => {
  let f = c.getFile('image');
  if (f === null) {
    c.res.body = c.service.api.ret('EUDEF', '没有发现图片');
    return ;
  }
  if (f.length > 3000000) {
    c.res.body = c.service.api.ret('EUDEF', '图片超过限制大小');
    return ;
  }
  
  await next(c);
};