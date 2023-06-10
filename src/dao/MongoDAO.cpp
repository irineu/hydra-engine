//
// Created by Irineu Antunes on 04/04/23.
//

#include "MongoDAO.h"

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <bsoncxx/document/view.hpp>
#include <mongocxx/exception/operation_exception.hpp>
#include <mongocxx/uri.hpp>

const mongocxx::instance hydra::MongoDAO::instance{};
std::vector<hydra::entity::ScriptEntity> hydra::MongoDAO::scripts;

using namespace bsoncxx::builder::basic;

void hydra::MongoDAO::setup() {
    this->logger_ = quill::create_logger("MongoDAO");
    this->logger_->set_log_level(quill::LogLevel::TraceL3);
    this->logger_->init_backtrace(2, quill::LogLevel::Critical);

    this->connect();
    //this->loadScripts();
}

void hydra::MongoDAO::loadScripts(){

    scripts.clear();

    mongocxx::database db = this->client["hydra"];
    mongocxx::collection scriptsCollection = db["scripts"];

    mongocxx::cursor resultCursor = scriptsCollection.find({});

    for(bsoncxx::document::view doc : resultCursor){
        //doc.type() == bsoncxx::type::k_string)
        //std::cout << doc["path"].get_string().value << std::endl;

        std::string scriptPath = doc["path"].get_string().value.to_string();

        hydra::entity::ScriptEntity scriptEntity;
        scriptEntity.path = scriptPath;

        std::vector<std::string> inputActions;
        std::vector<std::string> outputActions;

        for(auto inputAction : doc["inputActions"].get_array().value){
            inputActions.push_back(inputAction.get_string().value.to_string());
        }

        for(auto outputAction : doc["outputActions"].get_array().value){
            outputActions.push_back(outputAction.get_string().value.to_string());
        }

        scriptEntity.inputActions = inputActions;
        scriptEntity.outputActions = outputActions;

        scripts.push_back(scriptEntity);

        LOG_DEBUG(this->logger_, "Loading script: {}", scriptPath);

        //std::cout << bsoncxx::to_json(doc, bsoncxx::ExtendedJsonMode::k_relaxed) << std::endl;
    }
}

void hydra::MongoDAO::connect() {

    LOG_DEBUG(this->logger_, "Connecting...");

    mongocxx::uri uri("mongodb://localhost:27017");
    this->client = mongocxx::client(uri);

    mongocxx::database db = this->client["hydra"];

    try{
        bsoncxx::document::value command = make_document(kvp("ping", 1));
        auto res = db.run_command(command.view());

        LOG_INFO(this->logger_, "Connected!");
    }catch(mongocxx::operation_exception &e){
        LOG_ERROR(this->logger_, "Failed to connect!");
        exit(1);
    }


    /*mongocxx::collection scriptsCol = db["scripts"];

    bsoncxx::document::value mainScript = make_document(
            kvp("name", "main"),
            kvp("code", "'Hello world!'")
            );
    */

//    bsoncxx::stdx::optional<mongocxx::result::insert_one> id = scriptsCol.insert_one(mainScript.view());
//    std::cout << id->inserted_id().get_oid().value.to_string() << std::endl;

//    std::vector<std::string> names = this->client.list_database_names();

//    for (const auto &name: names){
//        std::cout << name << std::endl;
//    }
//    std::cout << "hello from dao" << std::endl;
}