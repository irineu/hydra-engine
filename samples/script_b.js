class ModB extends Base{
    constructor(){
        super();
    }

    run(){
        console.log("hueheueh");
        setTimeout(()=>{
            console.log("sucesso2");
            this.next();
        }, 4000);
    }
}