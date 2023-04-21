//
// Created by Irineu Antunes on 05/04/23.
//

#include "HTTPClient.h"
#include "Async.h"
#include <iostream>
#include <fstream>

namespace hydra {
    namespace bindings {

//        void HTTPClient::fail(boost::beast::error_code ec, char const* what)
//        {
//            std::cerr << what << ": " << ec.message() << "\n";
//        }

        //static
         void HTTPClient::handler(const v8::FunctionCallbackInfo <v8::Value> &args){

            v8::Isolate  * isolate = args.GetIsolate();
            v8::Local<v8::Context> ctx = isolate->GetCurrentContext();

            v8::String::Utf8Value host(isolate, args[0]);
            v8::String::Utf8Value port(isolate, args[1]);
            v8::String::Utf8Value target(isolate, args[2]);

            std::cout << *host << ":" << *port << *target << std::endl;

            v8::Local<v8::Value> callback = args[4];
            v8::Local<v8::Value> callbackError = args[5];


            if(!callback->IsFunction())
            {
                std::cout << "bad" << std::endl;
                return;
            }

            if(!callbackError->IsFunction())
            {
                std::cout << "bad" << std::endl;
                return;
            }


            CallbackStruct *cbStruct = new CallbackStruct();

            cbStruct->success.Reset(isolate,callback.As<v8::Function>());
            cbStruct->fail.Reset(isolate,callbackError.As<v8::Function>());
            cbStruct->isolate = isolate;

            std::make_shared<hydra::bindings::HTTPClient>(*Async::IOC)->run(
                    std::string(*host).c_str(),
                    std::string(*port).c_str(),
                    std::string(*target).c_str(),
                    11, [cbStruct](){

                        boost::asio::steady_timer t(*Async::IOC, boost::asio::chrono::seconds(5));
                        t.wait();

                        v8::Local<v8::Function> callback = v8::Local<v8::Function>::New(
                                cbStruct->isolate,
                                cbStruct->success
                        );
                        v8::Local<v8::Value> result;

                        v8::Local<v8::Function> cb = v8::Local<v8::Function>::New(
                                cbStruct->isolate,
                                callback.As<v8::Function>()
                        );

                        if(cb.As<v8::Function>()->Call(
                                cbStruct->isolate->GetCurrentContext(),
                                v8::Undefined(cbStruct->isolate),
                                0,
                                NULL).ToLocal(&result)
                                )
                        {
                            std::cout << "cb okx" << std::endl;
                        }
                        else
                        {
                            std::cout << "cb nokkk" << std::endl;
                        }

                        delete cbStruct;



                    }, [cbStruct, callbackError](boost::beast::error_code errorCode, char const* msg){
                        std::cout << "TODO handle error" << std::endl;
                        delete cbStruct;
                    });
        }

        void HTTPClient::run(
                char const* host,
                char const* port,
                char const* target,
                int version,
                std::function<void()> on_success,
                std::function<void(boost::beast::error_code, char const*)> on_fail)
        {
            // Set up an HTTP GET request message
            req_.version(version);
            req_.method(http::verb::get);
            req_.target(target);
            req_.set(http::field::host, host);
            req_.set(http::field::user_agent, BOOST_BEAST_VERSION_STRING);

            this->on_success_ = on_success;
            this->on_fail_ = on_fail;

            // Look up the domain name
            resolver_.async_resolve(
                    host,
                    port,
                    boost::beast::bind_front_handler(
                            &HTTPClient::on_resolve,
                            shared_from_this()));
        }

        void HTTPClient::on_resolve(boost::beast::error_code ec,boost::asio::ip::tcp::resolver::results_type results)
        {
            if(ec)
                return this->on_fail_(ec, "resolve");

            // Set a timeout on the operation
            stream_.expires_after(std::chrono::seconds(30));

            // Make the connection on the IP address we get from a lookup
            stream_.async_connect(
                    results,
                    boost::beast::bind_front_handler(
                            &HTTPClient::on_connect,
                            shared_from_this()));
        }

        void HTTPClient::on_connect(boost::beast::error_code ec, boost::asio::ip::tcp::resolver::results_type::endpoint_type)
        {
            if(ec)
                return this->on_fail_(ec, "connect");

            // Set a timeout on the operation
            stream_.expires_after(std::chrono::seconds(30));

            // Send the HTTP request to the remote host
            http::async_write(stream_, req_,boost::beast::bind_front_handler(&HTTPClient::on_write, shared_from_this()));
        }

        void HTTPClient::on_write(
                boost::beast::error_code ec,
                std::size_t bytes_transferred)
        {
            boost::ignore_unused(bytes_transferred);

            if(ec)
                return this->on_fail_(ec, "write");

            http::async_read(stream_, buffer_, res_,boost::beast::bind_front_handler(&HTTPClient::on_read,shared_from_this()));
        }

        void HTTPClient::on_read(boost::beast::error_code ec,std::size_t bytes_transferred) {
            boost::ignore_unused(bytes_transferred);

            if(ec)
                return this->on_fail_(ec, "read");

            // Write the message to standard out
            //std::cout << res_ << std::endl;
            //std::cout << res_.body() << std::endl;
            //std::cout << res_["Content-Type"] << std::endl;

            for( auto itx = res_.base().begin() ; itx != res_.base().end() ; itx++)
            {
                std::cout << itx->name_string() << "," << itx->value() << std::endl;
            }

            std::cout << res_["X-Powered-By"] << std::endl;

            stream_.socket().shutdown(boost::asio::ip::tcp::socket::shutdown_both, ec);

            if(ec && ec != boost::beast::errc::not_connected)
                return this->on_fail_(ec, "shutdown");

            this->on_success_();
        }

    } // hydra
} // bindings