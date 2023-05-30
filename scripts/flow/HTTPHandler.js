class HTTPHandler extends Base{

    constructor() {
        super();

        super.addOutputAction("onRequest");
    }

    getMenuOptions(canvas){
        return [{
            content: "Title",
            callback: LGraphCanvas.onShowPropertyEditor
        }];
    }
}

module = HTTPHandler;
