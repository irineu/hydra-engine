//
// Created by Irineu Antunes on 20/04/23.
//

#ifndef HYDRA_ENGINE_ASYNC_H
#define HYDRA_ENGINE_ASYNC_H

#include <boost/beast/core.hpp>
#include <map>
#include <boost/uuid/uuid.hpp>
#include <boost/uuid/uuid_generators.hpp>
#include <boost/uuid/uuid_io.hpp>
#include <iostream>
#include "v8.h"

namespace hydra {
    namespace bindings {

        class Async {
        public:

            struct CallbackStruct{
                v8::Global<v8::Function> success;
                v8::Global<v8::Function> fail;
                v8::Isolate  * isolate;
            };

            static boost::asio::io_context IOC;
            static std::map<std::string, boost::asio::steady_timer*> timerMap;

            static std::string addTimer(boost::asio::steady_timer* t);
            static void eraseTimer(std::string uuid);

            static std::string setTimeout(std::function<void()> fn, int ms);
            static std::string setInterval(std::function<void(std::string)> fn, int ms);

            static void setTimeoutHandler(const v8::FunctionCallbackInfo <v8::Value> &args);
        };

    } // hydra
} // bindings

#endif //HYDRA_ENGINE_ASYNC_H
