export default class View {
  onLoad() {
    this.changeCommandBtnsVisibility()
  }

  changeCommandBtnsVisibility(hide = true) {
    Array.from(document.querySelectorAll('[name=command]'))
      .forEach(btn => {
        const fn = hide ? 'add' : 'remove'
        btn.classList[fn]('unassigned')
        function onClickReset() { }
        btn.onclick = onClickReset
      })
  }
}
