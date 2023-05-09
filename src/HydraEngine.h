//
// Created by Irineu Antunes on 22/04/23.
//

#ifndef HYDRA_ENGINE_HYDRAENGINE_H
#define HYDRA_ENGINE_HYDRAENGINE_H

#include "quill/Quill.h"

#include <iostream>
#include <fstream>

#include <boost/beast/core.hpp>

#include "bindings/Console.h"
#include "bindings/HTTPClient.h"
#include "bindings/Async.h"

//#include "dao/MongoDAO.h"

#include "v8.h"
#include "libplatform/libplatform.h"

namespace hydra {

    class HydraEngine {
    public:
        HydraEngine(boost::asio::io_context * ctx);
        HydraEngine(boost::asio::io_context * ctx, quill::Logger* logger);
        void start();
        void exec(std::function<void()> fn);

    private:
        void initializeV8();
        void setupLog();
        std::string loadFile(std::string filename);
        std::string loadCode();

        quill::Logger * logger_;
        std::unique_ptr<v8::Platform> platform_;
        v8::Isolate * isolate_;
        v8::Local<v8::Context> context_;

        static std::map<std::string, std::function<void()>> cbMap;
    };

} // hydra

#endif //HYDRA_ENGINE_HYDRAENGINE_H
