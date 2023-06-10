//
// Created by Irineu Antunes on 04/04/23.
//

#ifndef HYDRA_ENGINE_MONGODAO_H
#define HYDRA_ENGINE_MONGODAO_H

#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include "quill/Quill.h"
#include "../entities/ScriptEntity.h"

namespace hydra {

    class MongoDAO {
    private:
        const static mongocxx::instance instance;
        mongocxx::client client;
        quill::Logger *logger_;

        void connect();

    public:
        static std::vector<hydra::entity::ScriptEntity> scripts;

        void setup();

        void loadScripts();

    };
}


#endif //HYDRA_ENGINE_MONGODAO_H
