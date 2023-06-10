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
#include "dao/MongoDAO.h"
#include "ports/http/HTTPServer.h"
#include <chrono>
#include <thread>

using namespace std::chrono_literals;


void setupMainLog() {
    std::shared_ptr<quill::Handler> stdout_handler = quill::stdout_handler();
    static_cast<quill::ConsoleHandler*>(stdout_handler.get())->enable_console_colours();

    stdout_handler->set_pattern("%(ascii_time) %(fileline)  %(logger_name) - %(message)", // format
                                "%Y-%m-%d %H:%M:%S.%Qms",  // timestamp format
                                quill::Timezone::GmtTime); // timestamp's timezone

    quill::Config cfg;
    cfg.default_handlers.emplace_back(stdout_handler);
    cfg.enable_console_colours = true;
    quill::configure(cfg);
    quill::start();
}

int main(){

    setupMainLog();

    hydra::MongoDAO * mongoDAO = new hydra::MongoDAO();
    mongoDAO->setup();

    boost::asio::io_context * ctx = new boost::asio::io_context();

    hydra::HydraEngine * engine = new hydra::HydraEngine(ctx, mongoDAO);
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

    delete mongoDAO;

    std::cout << "Hello World!" << std::endl;
}