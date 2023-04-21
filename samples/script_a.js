class ModA extends Base{
    constructor(){
        super();
    }

    run(){
        console.log("xpto");

        httpClient("google.com", "80", "/", 11, () => {
            this.next();
        }, () => {
            console.log("erro");
            this.next();
        });
    }
}