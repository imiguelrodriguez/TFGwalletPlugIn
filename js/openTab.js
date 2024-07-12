const open = document.querySelector("#open")
open.addEventListener("click",  async function onclick(event) {
    chrome.tabs.create({url: 'html/config.html'})
    event.preventDefault();
});
