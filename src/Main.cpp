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

int main(){

    boost::asio::io_context * ctx = new boost::asio::io_context();

    hydra::HydraEngine * engine = new hydra::HydraEngine(ctx);
    engine->start();
    engine->exec([]{
        std::cout << "uhuul" << std::endl;
    });
//    engine.exec();
//    engine.exec();
//    engine.exec();
//    engine.exec();

    HTTPServer server(engine);
    server.startServer(ctx);


    std::cout << "Hello World!" << std::endl;
}