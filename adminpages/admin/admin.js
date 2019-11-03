var user_preg = /^[a-z][a-z0-9\-\_]{4,30}$/i;
var email_preg = /^[a-z1-9][a-z0-9\-\_]{4,30}\@[\w\d\.]+$/i;
var pass_preg = /^[a-z0-9\-\_\.\!\@\#\$\%\^\&\*]{7,20}$/i;
var weak_preg1 = /^[a-z0-9]{7,20}$/i;
var weak_preg2 = /^[0-9]{7,20}$/i;
var _adm = document.getElementById('admin-list');

function adminTemp(d, u) {
  let op = `<a href="javascript:editAdmin('${d.username}');">编辑</a> &nbsp; &nbsp;
  <a href="javascript:delAdmin('${d.username}');" style="color:#491810;">删除</a>`;
  if (d.username === u.username) {
    op = '<p class="help-text">[当前用户]</p>';
  }
  return `<div class="cell small-12 medium-6 large-4" style="padding:0.2rem;">
    <div style="line-height:0.2rem;border-top:solid 0.2rem #af4567;width:90%;"></div>
    <p>用户名：${d.username}</p>
    <p>角色：${d.role}</p>
    <p>邮箱：${d.email}</p>
    <p>
      ${op}
    </p>
  </div>`;
}

function renderAdminList (dl) {
  let u = getUser();
  let html = '';
  for(let k in dl) {
    html += adminTemp(dl[k], u);
  }
  _adm.innerHTML = html;
}

function createAdmin (t) {
  let a = {
    username : document.getElementById('new-username').value.trim(),
    passwd : document.getElementById('new-passwd').value.trim(),
    email : document.getElementById('new-email').value.trim(),
    role : _dm.selected('#new-admin-role').value
  };
  if (!user_preg.test(a.username)) {
    sysnotify('用户名格式错误，5～30字符，支持：“字母数字-_”。并且以字母开头', 'err', 6000);
    return ;
  }
  if (!email_preg.test(a.email)) {
    sysnotify('邮箱格式错误', 'err', 3000);
    return ;
  }
  if (!pass_preg.test(a.passwd)) {
    sysnotify('密码不符合要求，需要7～20位，字母数字和特殊字符（-_.!@#$%^&*）。', 'err', 6000);
    return ;
  }

  t.disabled = true;
  userApiCall('/admin', {
    method : 'POST',
    headers : {
      'content-type' : 'text/plain'
    },
    body : JSON.stringify(a)
  }).then(d => {
    if (d.status === 'OK') {
      _adminList[a.username] = a;
      renderAdminList(_adminList);
      document.getElementById('new-username').value = '';
      document.getElementById('new-email').value = '';
      document.getElementById('new-passwd').value = '';
    } else {
      sysnotify(d.errmsg, 'err', 3000);
    }
  }).catch (err => {
    console.log(err);
  }).finally(() => {
    t.disabled = false;
  });
}

var _adminList = {};
window.onload = function () {
  let u = getUser();
  _dm.loading();
  userApiCall('/admin').then(d => {
    if (d.status === 'OK') {
      _adminList = d.data;
      renderAdminList(d.data);
    } else {
      sysnotify(d.errmsg);
    }
  }).finally(() => {
    _dm.unloading();
  });
};
