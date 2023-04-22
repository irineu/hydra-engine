//
// Created by Irineu Antunes on 20/04/23.
//

#include "Async.h"

namespace hydra {
    namespace bindings {

        boost::asio::io_context hydra::bindings::Async::IOC;
        std::map<std::string, boost::asio::steady_timer*> hydra::bindings::Async::timerMap;

        std::string  hydra::bindings::Async::addTimer(boost::asio::steady_timer *t) {
            boost::uuids::uuid uuid = boost::uuids::random_generator()();
            std::string strUUID = to_string(uuid);
            hydra::bindings::Async::timerMap[strUUID] = t;
            return strUUID;
        }

        void hydra::bindings::Async::eraseTimer(std::string uuid) {
            if(Async::timerMap.find( uuid ) != Async::timerMap.end()){
                Async::timerMap[uuid]->cancel();
                delete Async::timerMap[uuid];
                Async::timerMap.erase(uuid);
            }
        }

        std::string hydra::bindings::Async::setTimeout(std::function<void()> fn, int ms) {

            boost::asio::steady_timer * t = new boost::asio::steady_timer(hydra::bindings::Async::IOC, boost::asio::chrono::milliseconds (ms));
            std::string uuid = hydra::bindings::Async::addTimer(t);

            t->async_wait([uuid, fn](boost::system::error_code const& e){
                hydra::bindings::Async::eraseTimer(uuid);

                if (e == boost::asio::error::operation_aborted){
                    return;
                }

                fn();
            });

            return uuid;
        }

        void onTimeoutCB(std::string uuid, std::function<void(std::string)> fn, int ms){

            boost::asio::steady_timer * t = hydra::bindings::Async::timerMap[uuid];

            t->expires_from_now(boost::asio::chrono::milliseconds (ms));
            t->async_wait([uuid, fn, ms](boost::system::error_code const& e){

                //std::cout << "2st" << std::endl;
                if (e == boost::asio::error::operation_aborted){
                    //std::cout << "aborted" << std::endl;
                    return;
                }

                onTimeoutCB(uuid, fn, ms);
            });

            fn(uuid);
        }

        std::string hydra::bindings::Async::setInterval(std::function<void(std::string)> fn, int ms) {
            boost::asio::steady_timer * t = new boost::asio::steady_timer(hydra::bindings::Async::IOC, boost::asio::chrono::milliseconds (ms));
            std::string uuid = hydra::bindings::Async::addTimer(t);

            t->async_wait([uuid, fn, ms](boost::system::error_code const& e){

                //std::cout << "1st" << std::endl;
                if (e == boost::asio::error::operation_aborted){
                    //std::cout << "aborted" << std::endl;
                    return;
                }

                onTimeoutCB(uuid, fn, ms);
            });

            return uuid;
        }

    } // hydra
} // bindings