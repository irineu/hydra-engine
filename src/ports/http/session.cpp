//
// Created by Irineu Antunes on 24/04/23.
//

#include "session.h"
#include "HTTPServer.h"

session::session(tcp::socket &&socket, const std::shared_ptr<const std::string> &doc_root)  : stream_(std::move(socket)), doc_root_(doc_root){
}

int session::count = 0;

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

    // Construct a new parser for each message
    parser_.emplace();

    // Apply a reasonable limit to the allowed size
    // of the body in bytes to prevent abuse.
    parser_->body_limit(10000);


    // Make the request empty before reading,
    // otherwise the operation behavior is undefined.
    req_ = {};

    // Set the timeout.
    stream_.expires_after(std::chrono::seconds(30));

    // Read a request
//    http::async_read(stream_, buffer_,  *parser_,
//                     beast::bind_front_handler(
//                             &session::on_read,
//                             shared_from_this()));

    http::async_read(stream_, buffer_,  req_,
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

void session::on_read(beast::error_code ec, std::size_t bytes_transferred) {
    boost::ignore_unused(bytes_transferred);

    // This means they closed the connection
    if(ec == http::error::end_of_stream)
        return do_close();

    if(ec){
        std::cerr << "on read error: " << ec << std::endl;
        return;
    }

    std::shared_ptr<session> s = shared_from_this();

    session::count++;

    HTTPServer::engine_->exec([s]{
        // Send the response
        std::cerr << "xxxx " << std::endl;

        //s->send_response(HTTPServer::handle_request(*(s->doc_root_), s->parser_->release()));
        s->send_response(HTTPServer::handle_request(*(s->doc_root_), std::move(s->req_)));
    });


}