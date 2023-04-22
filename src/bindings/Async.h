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

namespace hydra {
    namespace bindings {

        class Async {
        public:
            static boost::asio::io_context IOC;
            static std::map<std::string, boost::asio::steady_timer*> timerMap;

            static std::string addTimer(boost::asio::steady_timer* t);
            static void eraseTimer(std::string uuid);

            static std::string setTimeout(std::function<void()> fn, int ms);
        };

    } // hydra
} // bindings

#endif //HYDRA_ENGINE_ASYNC_H
