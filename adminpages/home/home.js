window.onload = function () {
  let u = getUser();
  document.getElementById('user-role').innerHTML = '用户角色：' + u.role;
}