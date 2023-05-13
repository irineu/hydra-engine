//
// Created by Irineu Antunes on 24/04/23.
//

#ifndef HYDRA_ENGINE_SESSION_H
#define HYDRA_ENGINE_SESSION_H

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
#include "HTTPServer.h"

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = boost::asio::ip::tcp;

class session : public std::enable_shared_from_this<session>{
    beast::tcp_stream stream_;
    beast::flat_buffer buffer_;
    std::shared_ptr<std::string const> doc_root_;
    http::request<http::string_body> req_;

public:

    static int count;
    boost::optional<http::request_parser<http::string_body>> parser_;

    session(
            tcp::socket&& socket,
            std::shared_ptr<std::string const> const& doc_root);

    void run();

    void do_read();

    void on_read(beast::error_code ec, std::size_t bytes_transferred);

    void send_response(http::message_generator&& msg);

    void on_write(bool keep_alive,beast::error_code ec,std::size_t bytes_transferred);

    void do_close();

};


#endif //HYDRA_ENGINE_SESSION_H
