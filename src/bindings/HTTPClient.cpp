//
// Created by Irineu Antunes on 05/04/23.
//

#include "HTTPClient.h"

namespace hydra {
    namespace bindings {

        void HTTPClient::fail(boost::beast::error_code ec, char const* what)
        {
            std::cerr << what << ": " << ec.message() << "\n";
        }

        void HTTPClient::run(
                char const* host,
                char const* port,
                char const* target,
                int version)
        {
            // Set up an HTTP GET request message
            req_.version(version);
            req_.method(http::verb::get);
            req_.target(target);
            req_.set(http::field::host, host);
            req_.set(http::field::user_agent, BOOST_BEAST_VERSION_STRING);

            // Look up the domain name
            resolver_.async_resolve(
                    host,
                    port,
                    boost::beast::bind_front_handler(
                            &HTTPClient::on_resolve,
                            shared_from_this()));
        }

        void HTTPClient::on_resolve(
                boost::beast::error_code ec,
                boost::asio::ip::tcp::resolver::results_type results)
        {
            if(ec)
                return fail(ec, "resolve");

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
                return fail(ec, "connect");

            // Set a timeout on the operation
            stream_.expires_after(std::chrono::seconds(30));

            // Send the HTTP request to the remote host
            http::async_write(stream_, req_,
                              boost::beast::bind_front_handler(
                                      &HTTPClient::on_write,
                                      shared_from_this()));
        }

        void HTTPClient::on_write(
                boost::beast::error_code ec,
                std::size_t bytes_transferred)
        {
            boost::ignore_unused(bytes_transferred);

            if(ec)
                return fail(ec, "write");

            // Receive the HTTP response
            http::async_read(stream_, buffer_, res_,
                             boost::beast::bind_front_handler(
                                     &HTTPClient::on_read,
                                     shared_from_this()));
        }

        void HTTPClient::on_read(
                boost::beast::error_code ec,
                std::size_t bytes_transferred)
        {
            boost::ignore_unused(bytes_transferred);

            if(ec)
                return fail(ec, "read");

            // Write the message to standard out
            //std::cout << res_ << std::endl;
            //std::cout << res_.body() << std::endl;
            //std::cout << res_["Content-Type"] << std::endl;

            for( auto itx = res_.base().begin() ; itx != res_.base().end() ; itx++)
            {
                std::cout << itx->name_string() << "," << itx->value() << std::endl;
            }

            std::cout << res_["X-Powered-By"] << std::endl;

            // Gracefully close the socket
            stream_.socket().shutdown(boost::asio::ip::tcp::socket::shutdown_both, ec);

            // not_connected happens sometimes so don't bother reporting it.
            if(ec && ec != boost::beast::errc::not_connected)
                return fail(ec, "shutdown");

            // If we get here then the connection is closed gracefully
        }

    } // hydra
} // bindings