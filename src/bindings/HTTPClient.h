//
// Created by Irineu Antunes on 05/04/23.
//

#ifndef HYDRA_ENGINE_HTTPCLIENT_H
#define HYDRA_ENGINE_HTTPCLIENT_H

#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/strand.hpp>
#include <iostream>
#include "v8.h"

namespace hydra {
    namespace bindings {

        namespace http = boost::beast::http;

        struct CallbackStruct{
            v8::Global<v8::Function> success;
            v8::Global<v8::Function> fail;
            v8::Isolate  * isolate;
        };

        class HTTPClient : public std::enable_shared_from_this<HTTPClient> {
            boost::beast::tcp_stream stream_;
            boost::asio::ip::tcp::resolver resolver_;
            http::request<http::empty_body> req_;
            boost::beast::flat_buffer buffer_;
            http::response<http::string_body> res_;
            std::function<void()> on_success_;
            std::function<void(boost::beast::error_code, char const*)> on_fail_;

        public:
            explicit
            HTTPClient(boost::asio::io_context &ioc)
            : resolver_(boost::asio::make_strand(ioc)), stream_(boost::asio::make_strand(ioc)) {}

            void run(char const* host,char const* port,char const* target,int version, std::function<void()> on_success, std::function<void(boost::beast::error_code, char const*)> on_fail);
            void on_resolve(boost::beast::error_code ec, boost::asio::ip::tcp::resolver::results_type results);
            void on_connect(boost::beast::error_code ec, boost::asio::ip::tcp::resolver::results_type::endpoint_type);
            void on_write(boost::beast::error_code ec, std::size_t bytes_transferred);
            void on_read(boost::beast::error_code ec,std::size_t bytes_transferred);

            static void handler(const v8::FunctionCallbackInfo <v8::Value> &args);
        };
    } // hydra
} // bindings

#endif //HYDRA_ENGINE_HTTPCLIENT_H
