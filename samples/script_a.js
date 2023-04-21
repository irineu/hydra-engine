class ModA extends Base{
    constructor(){
        super();
    }

    run(){
        console.log("xpto");

        httpClient("google.com", "80", "/", 11, () => {
            console.log("sucesso");
            this.next();
        }, () => {
            console.log("erro");
            this.next();
        });
    }
}