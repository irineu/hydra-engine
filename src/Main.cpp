//
// Created by Irineu Antunes on 04/04/23.
//

#include <iostream>
#include <boost/beast/core.hpp>

//#include <fstream>
//#include "dao/MongoDAO.h"
//#include "bindings/Console.h"
//#include "bindings/HTTPClient.h"
//#include "bindings/Async.h"
//#include <boost/beast/core.hpp>
//#include <boost/asio/deadline_timer.hpp>
//
//#include "v8.h"
//#include "libplatform/libplatform.h"
//#include "v8-inspector.h"
//#include "v8-debug.h"
//#include "v8-function-callback.h"

#include "HydraEngine.h"
#include "ports/http/HTTPServer.h"
#include <chrono>
#include <thread>

using namespace std::chrono_literals;

int main(){

    boost::asio::io_context * ctx = new boost::asio::io_context();

    hydra::HydraEngine * engine = new hydra::HydraEngine(ctx);
    engine->start();

//    engine->exec([engine]{
//        std::cout << "uhuul" << std::endl;
//    });



//    engine.exec();
//    engine.exec();
//    engine.exec();
//    engine.exec();

    auto t = std::thread([&]{


        while(session::count <= 3){
            std::this_thread::sleep_for(3000ms);
        }
        if(session::count > 3){
            std::cout << "stop from thread" << std::endl;
            ctx->stop();
        }

    });


    HTTPServer server(engine);
    server.startServer(ctx);


    t.join();

    std::cout << "Hello World!" << std::endl;
}