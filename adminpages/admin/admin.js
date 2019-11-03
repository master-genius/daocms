var _adm = document.getElementById('admin-list');
function adminTemp(d) {
  return `<div class="cell small-12 medium-6 large-4" style="padding:0.2rem;">
    <p>用户名：${d.username}</p>
    <p>角色：${d.role}</p>
    <p>邮箱：${d.email}</p>
    <p><a href="javascript:editAdmin('${d.username}');">编辑</a></p>
  </div>`;
}

function renderAdminList (dl) {
  let html = '';
  for(let k in dl) {
    html += adminTemp(dl[k]);
  }
  _adm.innerHTML = html;
}

var _adminList = {};

window.onload = function () {
  let u = getUser();
  userApiCall('/admin').then(d => {
    if (d.status === 'OK') {
      _adminList = d.data;
      renderAdminList(d.data);
    } else {
      sysnotify(d.errmsg);
    }
  });
};