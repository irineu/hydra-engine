//
// Created by Irineu Antunes on 04/04/23.
//

#include <iostream>
#include "dao/MongoDAO.h"
#include <boost/beast/core.hpp>

#include "bindings/HTTPClient.h"

int main(){

//    MongoDAO dao;
//    dao.connect();

    boost::asio::io_context ioc;

    std::make_shared<hydra::bindings::HTTPClient>(ioc)->run("localhost", "3000", "/", 11);

    ioc.run();

    std::cout << "Hello World!" << std::endl;
}