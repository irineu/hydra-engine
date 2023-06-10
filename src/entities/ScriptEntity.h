//
// Created by Irineu Antunes on 10/06/23.
//

#ifndef HYDRA_ENGINE_SCRIPTENTITY_H
#define HYDRA_ENGINE_SCRIPTENTITY_H

#include <iostream>
#include <vector>

namespace hydra::entity {

    class ScriptEntity {
    private:

    public:
        std::string path;
        std::vector<std::string> inputActions;
        std::vector<std::string> outputActions;
    };
}
#endif //HYDRA_ENGINE_SCRIPTENTITY_H
