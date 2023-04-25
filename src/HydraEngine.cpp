//
// Created by Irineu Antunes on 22/04/23.
//

#include "HydraEngine.h"

namespace hydra {

    hydra::HydraEngine::HydraEngine(boost::asio::io_context * ctx){
        hydra::bindings::Async::IOC = ctx;
        this->setupLog();
        this->initializeV8();
    }

    void hydra::HydraEngine::initializeV8()
    {
        LOG_DEBUG(this->logger_, "Initializing V8...");
        this->platform_ = v8::platform::NewDefaultPlatform();
        v8::V8::InitializePlatform(this->platform_.get());
        v8::V8::Initialize();
        LOG_DEBUG(this->logger_, "Initialized V8!");
    }

    std::string hydra::HydraEngine::loadFile(std::string filename){
        std::string code = "";
        std::string line;
        std::ifstream file_a ("../samples/" + filename);
        if (file_a.is_open())
        {
            while ( getline (file_a,line) )
            {
                code += line + "\n";
            }
            file_a.close();
        }else{
            std::cout << "fnf";
        }

        return code;
    }

    void hydra::HydraEngine::setupLog() {
        std::shared_ptr<quill::Handler> stdout_handler = quill::stdout_handler();
        static_cast<quill::ConsoleHandler*>(stdout_handler.get())->enable_console_colours();

        stdout_handler->set_pattern("%(ascii_time) %(fileline)  %(logger_name) - %(message)", // format
                                    "%Y-%m-%d %H:%M:%S.%Qms",  // timestamp format
                                    quill::Timezone::GmtTime); // timestamp's timezone

        quill::Config cfg;
        cfg.default_handlers.emplace_back(stdout_handler);
        cfg.enable_console_colours = true;
        quill::configure(cfg);
        quill::start();

        //
        //    quill::Logger* v8Logger = quill::create_logger("V8");
        //
        //

        this->logger_ = quill::get_logger();
        this->logger_->set_log_level(quill::LogLevel::TraceL3);

        this->logger_->init_backtrace(2, quill::LogLevel::Critical);
    }

//LOG_BACKTRACE(this->logger_, "Backtrace log {}", 1);
//LOG_BACKTRACE(this->logger_, "Backtrace log {}", 2);
//
//LOG_DEBUG_NOFN(this->logger_, "123");
//LOG_DEBUG(this->logger_, "Debugging foo {}", 1234);
//LOG_INFO(v8Logger, "Welcome to Quill!");
//LOG_ERROR(this->logger_, "An error message. error code {}", 123);
//LOG_WARNING(this->logger_, "A warning message.");
//LOG_CRITICAL(this->logger_, "A critical error.");
//
//LOG_TRACE_L1(this->logger_, "{:>30}", "right aligned");
//LOG_TRACE_L2(this->logger_, "Positional arguments are {1} {0} ", "too", "supported");
//LOG_TRACE_L3(this->logger_, "Support for floats {:03.2f}", 1.23456);

    std::string hydra::HydraEngine::loadCode() {

        std::string  code = "";

        code.append(loadFile("../samples/base.js"));
        code.append("\r\n");
        code.append(loadFile("../samples/script_a.js"));
        code.append("\r\n");
        code.append(loadFile("../samples/script_b.js"));
        code.append("\r\n");
        code.append(loadFile("../samples/script_c.js"));
        code.append("\r\n");
        code.append(loadFile("../samples/rule.js"));
        code.append("\r\n");

        return code;
    }

    void hydra::HydraEngine::start() {

        v8::Isolate::CreateParams create_params;
        create_params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
        this->isolate_ = v8::Isolate::New(create_params);
        //{

            LOG_DEBUG(this->logger_, "Setting Console Delegate...");

            hydra::bindings::Console * console = new hydra::bindings::Console(this->isolate_);
            v8::debug::SetConsoleDelegate(this->isolate_, console);

            v8::Isolate::Scope isolate_scope(this->isolate_);
            v8::HandleScope handle_scope(this->isolate_);

            v8::Local<v8::ObjectTemplate> global_template = v8::ObjectTemplate::New(this->isolate_);

            LOG_DEBUG(this->logger_, "Setting Bindings...");

            global_template->Set(
                    v8::String::NewFromUtf8(this->isolate_, "httpClient", v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(this->isolate_, hydra::bindings::HTTPClient::handler)
            );

            global_template->Set(
                    v8::String::NewFromUtf8(this->isolate_, "setTimeout", v8::NewStringType::kNormal).ToLocalChecked(),
                    v8::FunctionTemplate::New(this->isolate_, hydra::bindings::Async::setTimeoutHandler));



            v8::Local<v8::Context> context = v8::Context::New(this->isolate_, NULL, global_template);

            v8::Context::Scope context_scope(context);


            LOG_DEBUG(this->logger_, "Loading Code...");
            std::string code = this->loadCode();

            v8::Local<v8::String> source = v8::String::NewFromUtf8(this->isolate_, code.c_str(),v8::NewStringType::kNormal).ToLocalChecked();

            LOG_DEBUG(this->logger_, "Compiling Code...");
            v8::Local<v8::Script> script = v8::Script::Compile(context, source).ToLocalChecked();
            v8::Local<v8::Value> result = script->Run(context).ToLocalChecked();

            v8::String::Utf8Value utf8(this->isolate_, result);
            //printf("output: %s\n", *utf8);

            //https://stackoverflow.com/questions/22877875/getting-a-localized-global-scope-for-a-v8-function
            //v8::Handle<v8::Object> global_output = context->Global();


//        {
//            v8::Local<v8::Array> props = global_output->GetPropertyNames(context).ToLocalChecked();
//
//            for (int j = 0; j <  props->Length(); ++j) {
//                v8::Local<v8::Value> d = props->Get(context, v8::Integer::New(isolate, j)).ToLocalChecked();//props->Get();
//                v8::String::Utf8Value str(isolate, d->ToString(context).ToLocalChecked());
//                std::cout << ">" << *str << std::endl;
//            }
//        }



            v8::Handle<v8::Object> global_output = this->isolate_->GetCurrentContext()->Global();
            this->runFunction_ = global_output->Get(context, v8::String::NewFromUtf8(this->isolate_,"run").ToLocalChecked()).ToLocalChecked();
            this->rule___ = global_output->Get(context, v8::String::NewFromUtf8(this->isolate_,"rule").ToLocalChecked()).ToLocalChecked();;
            this->context_ = context;

            if ((*this->runFunction_)->IsFunction()) {
                LOG_INFO(this->logger_, "Engine started!");
            }else{
                LOG_CRITICAL(this->logger_, "No run function detected on code!");
                //TODO throw error
                return;
            }
        //}

//        boost::asio::steady_timer timer(hydra::bindings::Async::IOC, boost::asio::chrono::seconds(10));
//        timer.async_wait([](boost::system::error_code const& err){
//            std::cout << "dead" << std::endl;
//        });
//
//        hydra::bindings::Async::IOC.run();

//        this->isolate_->Dispose();
//        v8::V8::Dispose();
//        v8::V8::DisposePlatform();
//        delete create_params.array_buffer_allocator;

        /*MongoDAO dao;
        dao.connect();
         */
    }

    void hydra::HydraEngine::exec() {

        v8::Isolate::Scope isolate_scope(this->isolate_);
        v8::HandleScope handle_scope(this->isolate_);

        this->context_ = v8::Local<v8::Context>::New(
                this->isolate_,
                this->context_
        );

        v8::Context::Scope context_scope(this->context_);

        v8::Handle<v8::Object> global_output = this->isolate_->GetCurrentContext()->Global();

        //v8::Local<v8::Value> foo_arg = v8::String::NewFromUtf8(isolate, "arg from C++").ToLocalChecked();

        v8::Local<v8::Value> rule_arg = v8::Handle<v8::Value>::New(
                this->isolate_,
                this->rule___
                ).As<v8::Value>();


        v8::Handle<v8::Value> rf = v8::Handle<v8::Value>::New(
                this->isolate_,
                this->runFunction_
                );

        {
            v8::TryCatch trycatch(this->isolate_);

            v8::MaybeLocal<v8::Value> foo_ret = rf.As<v8::Object>()->CallAsFunction(this->context_, this->context_->Global(), 0, NULL);
            v8::MaybeLocal<v8::Value> foo_ret2 = rf.As<v8::Object>()->CallAsFunction(this->context_, this->context_->Global(), 1, &rule_arg);
//                  v8::MaybeLocal<v8::Value> foo_ret = runFunc.As<v8::Object>()->CallAsFunction(context, context->Global(), 0, NULL);

            if (!foo_ret.IsEmpty()) {
                v8::String::Utf8Value utf8Value(this->isolate_, foo_ret.ToLocalChecked());
                std::cout << "CallAsFunction result: " << *utf8Value << std::endl;
            } else {
                v8::String::Utf8Value utf8Value(this->isolate_, trycatch.Message()->Get());
                std::cout << "CallAsFunction didn't return a value, exception: " << *utf8Value << std::endl;
            }

            if (!foo_ret2.IsEmpty()) {
                v8::String::Utf8Value utf8Value(this->isolate_, foo_ret2.ToLocalChecked());
                std::cout << "CallAsFunction2 result: " << *utf8Value << std::endl;
            } else {
                v8::String::Utf8Value utf8Value(this->isolate_, trycatch.Message()->Get());
                std::cout << "CallAsFunction2 didn't return a value, exception: " << *utf8Value << std::endl;
            }
        }

        /*
        {
            // Method 1
            v8::TryCatch trycatch(isolate);
            //v8::MaybeLocal<v8::Value> foo_ret = value.As<v8::Object>()->CallAsFunction(context, context->Global(), 1, &foo_arg);
            v8::MaybeLocal<v8::Value> foo_ret = value.As<v8::Object>()->CallAsFunction(context, context->Global(),
                                                                                       0, NULL);
            if (!foo_ret.IsEmpty()) {
                v8::String::Utf8Value utf8Value(isolate, foo_ret.ToLocalChecked());
                std::cout << "CallAsFunction result: " << *utf8Value << std::endl;
            } else {
                v8::String::Utf8Value utf8Value(isolate, trycatch.Message()->Get());
                std::cout << "CallAsFunction didn't return a value, exception: " << *utf8Value << std::endl;
            }
        }
         */

        /*
        {
            // Method 2
            v8::TryCatch trycatch(isolate);
            v8::Local<v8::Object> foo_object = value.As<v8::Object>();
            v8::MaybeLocal<v8::Value> foo_result = v8::Function::Cast(*foo_object)->Call(context, context->Global(), 1, &foo_arg);
            if (!foo_result.IsEmpty()) {
                std::cout << "Call result: " << *(v8::String::Utf8Value(isolate, foo_result.ToLocalChecked())) << std::endl;
            } else {
                v8::String::Utf8Value utf8Value(isolate, trycatch.Message()->Get());
                std::cout << "CallAsFunction didn't return a value, exception: " << *utf8Value << std::endl;
            }
        }
         */


    }

} // hydra