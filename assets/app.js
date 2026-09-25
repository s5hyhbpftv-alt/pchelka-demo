(function () {
  var s = document.createElement('script');
  s.src = 'https://raw.githubusercontent.com/s5hyhbpftv-alt/pchelka-demo/5c94ca870eec6dcfb12896d38a5d1d756932c7b2/assets/app.js';
  s.onload = function () {
    var b = document.createElement('script');
    b.src = 'assets/hero-boot.js';
    document.body.appendChild(b);
  };
  s.onerror = function () {
    var b = document.createElement('script');
    b.src = 'assets/hero-boot.js';
    document.body.appendChild(b);
  };
  document.head.appendChild(s);
})();
