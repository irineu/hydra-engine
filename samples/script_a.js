class ModA extends Base{
    constructor(){
        super();
    }

    onHandle(ctx){
        console.log(JSON.stringify(ctx));
        ctx["a"] = true;
        this.callOutputAction("next", ctx);

        // setTimeout((arg0, arg1, arg2)=>{
        //
        //     // console.log(arg0);
        //     // console.log(arg1);
        //     // console.log(arg2);
        //     // console.log("setTimeout funfou", arg0, arg1, arg2);
        //
        //     // httpClient("google.com", "80", "/", 11, () => {
        //     //     this.next();
        //     // }, () => {
        //     //     console.log("erro");
        //     //     this.next();
        //     // });
        //
        //     this.next();
        //
        // }, 500, "A", "B", 99);
    }
}