document.body.insertAdjacentHTML('beforeend',`<div class="bar">
<a href="1.html">1 · Дверь из света</a><a href="2.html">2 · Прожектор</a><a href="3.html">3 · Свет под дверью</a>
<button onclick="location.reload()">↻ Повторить</button></div>`);
document.querySelectorAll('.bar a').forEach(a=>{if(location.pathname.endsWith(a.getAttribute('href')))a.classList.add('on')});
