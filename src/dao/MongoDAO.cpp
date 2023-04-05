//
// Created by Irineu Antunes on 04/04/23.
//

#include "MongoDAO.h"
#include <iostream>

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>

const mongocxx::instance MongoDAO::instance{};

using namespace bsoncxx::builder::basic;

void MongoDAO::connect() {

    mongocxx::uri uri("mongodb://localhost:27017");
    this->client = mongocxx::client(uri);

    if(!this->client){
        std::cout<<"db is not started";
    }else{
        std::cout<<"db is  started";
    }

    std::cout<< std::endl;

    mongocxx::database db = this->client["hydra"];
    mongocxx::collection scriptsCol = db["scripts"];

    bsoncxx::document::value mainScript = make_document(
            kvp("name", "main"),
            kvp("code", "'Hello world!'")
            );

    bsoncxx::stdx::optional<mongocxx::result::insert_one> id = scriptsCol.insert_one(mainScript.view());
    std::cout << id->inserted_id().get_oid().value.to_string() << std::endl;

    std::vector<std::string> names = this->client.list_database_names();

    for (const auto &name: names){
        std::cout << name << std::endl;
    }
    std::cout << "hello from dao" << std::endl;
}