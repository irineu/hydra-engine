//
// Created by Irineu Antunes on 24/04/23.
//

#ifndef HYDRA_ENGINE_HTTPSERVER_H
#define HYDRA_ENGINE_HTTPSERVER_H

#include <boost/beast/core.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/dispatch.hpp>
#include <boost/asio/strand.hpp>
#include <boost/config.hpp>
#include <algorithm>
#include <cstdlib>
#include <functional>
#include <iostream>
#include <memory>
#include <string>
#include <thread>
#include "session.h"
#include "../../HydraEngine.h"
#include "quill/Quill.h"

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = boost::asio::ip::tcp;

class HTTPServer {


public:
    HTTPServer(hydra::HydraEngine * engine);
    //template <class Body, class Allocator> static http::message_generator handle_request(beast::string_view doc_root, http::request<Body, http::basic_fields<Allocator>>&& req);
    static http::message_generator handle_request(beast::string_view doc_root, http::request<http::string_body>&& req);

    void startServer(boost::asio::io_context * ctx);
    static hydra::HydraEngine * engine_;
private:
    quill::Logger * logger_;
};


#endif //HYDRA_ENGINE_HTTPSERVER_H
