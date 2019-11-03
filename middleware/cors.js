module.exports = async (c, next) => {
    if (!c.headers['referer']) {
        c.headers['referer'] = '';
    }

    if (c.headers['referer'].indexOf('https://servicewechat.com') == 0
        || c.headers['referer'].indexOf('https://www.w3xm.top') == 0
        || c.headers['referer'].indexOf('https://w3xm.top') == 0
        || c.headers['referer'].indexOf('https://w3xm.cn') == 0
        || c.headers['referer'].indexOf('https://www.w3xm.cn') == 0
        || c.headers['referer'].indexOf('http://localhost:2') == 0)
    {
        c.setHeader('Access-control-allow-origin', '*');
        c.setHeader('Access-control-allow-methods', ['GET','POST','PUT','DELETE','OPTIONS']);
        c.setHeader('Access-Control-Allow-Headers', 'content-type');
        await next(c);
    } else {
        c.status(404);
    }
};