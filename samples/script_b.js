class ModB extends Base{
    constructor(){
        super();
    }

    run(){
        console.log("hueheueh");
        setTimeout(()=>{
            this.next();
        }, 4000);
    }
}