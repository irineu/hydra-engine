class ModB extends Base{
    constructor(){
        super();
    }

    run(){
        consolex.log("hueheueh");
        setTimeout(()=>{
            this.next();
        }, 4000);
    }
}