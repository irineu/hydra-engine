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

        void Async::setTimeoutHandler(const v8::FunctionCallbackInfo <v8::Value> &args) {

            v8::Local<v8::Value> callback = args[0];
            v8::Local<v8::Value> ms = args[1];

            if(!callback->IsFunction())
            {
                std::cout << "bad cb" << std::endl;
                return;
            }

            if(!ms->IsInt32())
            {
                std::cout << "bad ms" << std::endl;
                return;
            }

            std::cout << "args length: " << args.Length() << ", duration: " << ms.As<v8::Int32>()->Value() << std::endl;

            v8::Isolate  * isolate = args.GetIsolate();
            v8::Local<v8::Context> ctx = isolate->GetCurrentContext();

            hydra::bindings::Async::CallbackStruct *cbStruct = new hydra::bindings::Async::CallbackStruct();

            cbStruct->success.Reset(isolate,callback.As<v8::Function>());
            cbStruct->isolate = isolate;

            v8::Local<v8::Array> repassArgs = v8::Array::New(isolate, args.Length());

            for(int i = 0; i < args.Length(); i++){
                repassArgs->Set(ctx,i, args[i]);
            }

            cbStruct->args.Reset(isolate, repassArgs.As<v8::Array>());

            std::cout << repassArgs->Length() << std::endl;

            std::string timer = hydra::bindings::Async::setTimeout([cbStruct](){
                std::cout << "aeee" << std::endl;

                v8::Local<v8::Function> callback = v8::Local<v8::Function>::New(
                        cbStruct->isolate,
                        cbStruct->success
                );

                v8::Local<v8::Value> result;

                if(!callback->IsFunction())
                {
                    std::cout << "bad cb" << std::endl;
                    return;
                }

                v8::Local<v8::Array> args = v8::Local<v8::Array>::New(
                        cbStruct->isolate,
                        cbStruct->args
                );

                int argLen = args->Length();
                int repassArgLen = argLen - 2;

                std::cout << argLen << std::endl;

                v8::Handle<v8::Value> repassArgs[repassArgLen];

                for(int i = 2, j = 0; i < argLen; i++, j++){
                    repassArgs[j] = args->Get(cbStruct->isolate->GetCurrentContext(), i).ToLocalChecked();
                }

                if(callback.As<v8::Function>()->Call(
                        cbStruct->isolate->GetCurrentContext(),
                        v8::Undefined(cbStruct->isolate),
                        repassArgLen,
                        repassArgs).ToLocal(&result)
                        )
                {
                    std::cout << "cb okxxx" << std::endl;
                }
                else
                {
                    std::cout << "cb nok" << std::endl;
                }

            }, ms.As<v8::Int32>()->Value());
            //hydra::bindings::Async::eraseTimer(timer);


            /*v8::Handle<v8::Value> param_args [] = {
                    v8::String::NewFromUtf8(isolate,"Hello").ToLocalChecked()
            };

            if(callback.As<v8::Function>()->Call(
                    ctx,
                    v8::Undefined(isolate),
                    1,
                    param_args).ToLocal(&result)
                    )
            {
                std::cout << "cb ok" << std::endl;
            }
            else
            {
                std::cout << "cb nok" << std::endl;
            }*/

        }

    } // hydra
} // bindings