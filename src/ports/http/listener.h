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
            std::shared_ptr<std::string const> const& doc_root)
            : ioc_(ioc)
            , acceptor_(net::make_strand(ioc))
            , doc_root_(doc_root)
    {
        beast::error_code ec;

        // Open the acceptor
        acceptor_.open(endpoint.protocol(), ec);
        if(ec){
            std::cerr << ec << std::endl;
            return;
        }

        // Allow address reuse
        acceptor_.set_option(net::socket_base::reuse_address(true), ec);
        if(ec){
            std::cerr << ec << std::endl;
            return;
        }

        // Bind to the server address
        acceptor_.bind(endpoint, ec);
        if(ec){
            std::cerr << ec << std::endl;
            return;
        }

        // Start listening for connections
        acceptor_.listen(
                net::socket_base::max_listen_connections, ec);
        if(ec){
            std::cerr << ec << std::endl;
            return;
        }
    }

    // Start accepting incoming connections
    void
    run()
    {
        do_accept();
    }

private:
    void
    do_accept()
    {
        // The new connection gets its own strand
        acceptor_.async_accept(
                net::make_strand(ioc_),
                beast::bind_front_handler(
                        &listener::on_accept,
                        shared_from_this()));
    }

    void
    on_accept(beast::error_code ec, tcp::socket socket)
    {
        if(ec){
            std::cerr << ec << std::endl;
            return;
        }
        else
        {
            // Create the session and run it
            std::make_shared<session>(
                    std::move(socket),
                    doc_root_)->run();
        }

        // Accept another connection
        do_accept();
    }
};


#endif //HYDRA_ENGINE_LISTENER_H
