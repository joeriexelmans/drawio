class UiTools {

  constructor(ui) {
    this.ui = ui;
  }

  yesNo(msg, yesCallback, noCallback) {
    const yesButton = mxUtils.button("Yes", () => {
      this.ui.hideDialog();
      yesCallback();
    });
    yesButton.className = 'geBtn';
    const noButton = mxUtils.button("No", () => {
      this.ui.hideDialog();
      noCallback();
    });
    noButton.className = 'geBtn';
    this._showpopup(msg, [yesButton, noButton]);
  }

  msgBox(msg) {
    const ok = mxUtils.button("OK", () => {
      this.ui.hideDialog();
    });
    ok.className = 'geBtn gePrimaryBtn';
    this._showpopup(msg, [ok]);
  }

  _showpopup(msg, buttonlist) {
    const popupDiv = document.createElement('div');
    popupDiv.innerHTML = msg;
    const buttonsDiv = document.createElement('div')
    buttonlist.forEach(b => buttonsDiv.appendChild(b));
    buttonsDiv.style.marginTop = '20px';
    popupDiv.appendChild(buttonsDiv);
    popupDiv.style.textAlign = 'center';
    this.ui.showDialog(popupDiv,
      250, 110, // w, h
      false, // modal
      false); // closable
  }
}