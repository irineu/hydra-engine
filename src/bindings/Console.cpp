//
// Created by Irineu Antunes on 19/04/23.
//

#include "Console.h"
#include <iostream>

namespace hydra {
    namespace bindings {
        void Console::Log(const v8::debug::ConsoleCallArguments &args, const v8::debug::ConsoleContext &context) {
            v8::String::Utf8Value str(this->isolate_, args[0]);
            std::cout << *str << std::endl;
        }
    }
}