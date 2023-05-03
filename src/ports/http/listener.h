//
// Created by Irineu Antunes on 24/04/23.
//

#ifndef HYDRA_ENGINE_LISTENER_H
#define HYDRA_ENGINE_LISTENER_H

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

namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = boost::asio::ip::tcp;

class listener : public std::enable_shared_from_this<listener> {
    net::io_context& ioc_;
    tcp::acceptor acceptor_;
    std::shared_ptr<std::string const> doc_root_;

public:
    listener(
            net::io_context& ioc,
            tcp::endpoint endpoint,
            std::shared_ptr<std::string const> const& doc_root);


    // Start accepting incoming connections
    void run();

private:
    void do_accept();

    void on_accept(beast::error_code ec, tcp::socket socket);
};


#endif //HYDRA_ENGINE_LISTENER_H
