export default class Controller {
  constructor({ view, service }) {
    this.view = view
    this.service = service
  }

  static initialize(dependencies) {
    const controller = new Controller(dependencies)
    controller.onLoad()

    return controller
  }

  async commandReceived(text) {
    console.log('click');
  }

  onLoad() {
    this.view.configureOnBtnClick(this.commandReceived.bind(this))
    this.view.onLoad()
  }
}
