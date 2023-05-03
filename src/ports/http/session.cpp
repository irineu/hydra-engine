//
// Created by Irineu Antunes on 24/04/23.
//

#include "session.h"

session::session(tcp::socket &&socket, const std::shared_ptr<const std::string> &doc_root)  : stream_(std::move(socket)), doc_root_(doc_root){
}


void session::run() {
    // We need to be executing within a strand to perform async operations
    // on the I/O objects in this session. Although not strictly necessary
    // for single-threaded contexts, this example code is written to be
    // thread-safe by default.
    net::dispatch(stream_.get_executor(),
                  beast::bind_front_handler(
                          &session::do_read,
                          shared_from_this()));
}

void session::do_read() {
    // Make the request empty before reading,
    // otherwise the operation behavior is undefined.
    req_ = {};

    // Set the timeout.
    stream_.expires_after(std::chrono::seconds(30));

    // Read a request
    http::async_read(stream_, buffer_, req_,
                     beast::bind_front_handler(
                             &session::on_read,
                             shared_from_this()));
}



void session::send_response(http::message_generator &&msg) {
    bool keep_alive = msg.keep_alive();

    // Write the response
    beast::async_write(
            stream_,
            std::move(msg),
            beast::bind_front_handler(
                    &session::on_write, shared_from_this(), keep_alive));
}

void session::on_write(bool keep_alive, beast::error_code ec, std::size_t bytes_transferred) {
    boost::ignore_unused(bytes_transferred);

    if(ec){
        std::cerr << ec << std::endl;
        return;
    }

    if(! keep_alive)
    {
        // This means we should close the connection, usually because
        // the response indicated the "Connection: close" semantic.
        return do_close();
    }

    // Read another request
    do_read();
}

void session::do_close() {
    // Send a TCP shutdown
    beast::error_code ec;
    stream_.socket().shutdown(tcp::socket::shutdown_send, ec);

    // At this point the connection is closed gracefully
}