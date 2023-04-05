//
// Created by Irineu Antunes on 04/04/23.
//

#ifndef HYDRA_ENGINE_MONGODAO_H
#define HYDRA_ENGINE_MONGODAO_H

#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>

class MongoDAO {
private:
    const static mongocxx::instance instance;
    mongocxx::client client;
public:
    void connect();
};


#endif //HYDRA_ENGINE_MONGODAO_H
