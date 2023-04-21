//
// Created by Irineu Antunes on 19/04/23.
//

#ifndef HYDRA_ENGINE_CONSOLE_H
#define HYDRA_ENGINE_CONSOLE_H

#include "src/debug/interface-types.h"
#include "src/debug/debug-interface.h"

namespace hydra {
    namespace bindings {
        class Console : public v8::debug::ConsoleDelegate {
        public:
        //    void Debug(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Error(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Info(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
            void Log(const v8::debug::ConsoleCallArguments &args, const v8::debug::ConsoleContext &context);
        //    void Warn(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Dir(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void DirXml(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Table(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Trace(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Group(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void GroupCollapsed(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void GroupEnd(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Clear(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Count(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void CountReset(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Assert(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Profile(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void ProfileEnd(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void Time(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void TimeLog(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void TimeEnd(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}
        //    void TimeStamp(const v8::debug::ConsoleCallArguments& args, const v8::debug::ConsoleContext& context) {}

            explicit Console(v8::Isolate *isolate) {
                this->isolate_ = isolate;
            };

            ~Console() {}

        private:
            v8::Isolate *isolate_;
        };
    }
}

#endif //HYDRA_ENGINE_CONSOLE_H
