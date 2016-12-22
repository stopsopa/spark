// document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        var button = document.createElement('input');
        button.setAttribute('type', 'button');
        button.value = 'DOMContentLoaded';
        document.body.insertBefore(button, document.body.childNodes[0]);
    }, 2000)
// })