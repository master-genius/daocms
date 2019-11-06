window.onload = function () {
  let u = getUser();
  document.getElementById('user-role').innerHTML = '用户角色：' + u.role;
  document.getElementById('siteurl').innerHTML = 
    `<a href="${location.protocol}//${location.host}" target="_blank">进入网站</a>`;
  getLoadInfo();
};

function getLoadInfo() {
  let ld = document.getElementById('loadinfo');
  if (!ld) {
    return ;
  }
  var failedCount = 0;
  var interval = setInterval(() => {
    userApiCall('/loadinfo', {dataType:'text'}).then(d => {
      ld.innerHTML = d.replace(/\n/ig, '<br>');
    })
    .catch(err => {
      failedCount += 1;
      if (failedCount > 100) {
        clearInterval(interval);
      }
    });
  }, 2300);
}