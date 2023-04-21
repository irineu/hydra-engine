//
// Created by Irineu Antunes on 20/04/23.
//

#ifndef HYDRA_ENGINE_ASYNC_H
#define HYDRA_ENGINE_ASYNC_H

#include <boost/beast/core.hpp>

namespace hydra {
    namespace bindings {

        class Async {
        public:
            static boost::asio::io_context * IOC;
        };

    } // hydra
} // bindings

#endif //HYDRA_ENGINE_ASYNC_H
