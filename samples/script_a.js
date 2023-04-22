class ModA extends Base{
    constructor(){
        super();
    }

    run(){
        console.log("xpto");

        setTimeout(()=>{
            console.log("setTimeout funfou");

            httpClient("google.com", "80", "/", 11, () => {
                this.next();
            }, () => {
                console.log("erro");
                this.next();
            });

        }, 3000);



    }
}