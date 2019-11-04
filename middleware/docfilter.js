module.exports = async (c, next) => {
  try {
    c.body = JSON.parse(c.body);
  } catch (err) {
    c.res.body = c.service.api.ret('EBADDATA');
    return ;
  }

  if ()

  await next(c);
};
