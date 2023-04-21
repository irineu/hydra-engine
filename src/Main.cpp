//
// Created by Irineu Antunes on 04/04/23.
//

#include <iostream>
#include <fstream>
#include "dao/MongoDAO.h"
#include "bindings/Console.h"
#include "bindings/HTTPClient.h"
#include "bindings/Async.h"
#include <boost/beast/core.hpp>

#include "v8.h"
#include "libplatform/libplatform.h"
#include "v8-inspector.h"
#include "v8-debug.h"
#include "v8-function-callback.h"

std::unique_ptr<v8::Platform> platform;

void initializeV8()
{
    platform = v8::platform::NewDefaultPlatform();
    v8::V8::InitializePlatform(platform.get());
    v8::V8::Initialize();
}


std::string loadFile(std::string filename){
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

int main(){

//    MongoDAO dao;
//    dao.connect();

    boost::asio::io_context ioc;
    hydra::bindings::Async::IOC = &ioc;

    initializeV8();


    v8::Isolate::CreateParams create_params;
    create_params.array_buffer_allocator = v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    v8::Isolate* isolate = v8::Isolate::New(create_params);
    {
        hydra::bindings::Console * console = new hydra::bindings::Console(isolate);
        v8::debug::SetConsoleDelegate(isolate, console);

        v8::Isolate::Scope isolate_scope(isolate);
        v8::HandleScope handle_scope(isolate);

        v8::Local<v8::ObjectTemplate> global_template = v8::ObjectTemplate::New(isolate);

        global_template->Set(
                v8::String::NewFromUtf8(isolate, "httpClient", v8::NewStringType::kNormal).ToLocalChecked(),
                v8::FunctionTemplate::New(isolate, hydra::bindings::HTTPClient::handler)
                );


        global_template->Set(
                v8::String::NewFromUtf8(isolate, "setTimeout", v8::NewStringType::kNormal).ToLocalChecked(),
                v8::FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo <v8::Value> &args) {

                    v8::Local<v8::Value> callback = args[0];

                    if(!callback->IsFunction())
                    {
                        std::cout << "bad" << std::endl;
                        return;
                    }
                    v8::Isolate  * isolate = args.GetIsolate();
                    v8::Local<v8::Context> ctx = isolate->GetCurrentContext();

                    v8::Local<v8::Value> result;

                    v8::Handle<v8::Value> param_args [] = {
                            v8::String::NewFromUtf8(isolate,"Hello").ToLocalChecked()
                    };

                    /*if(callback.As<v8::Function>()->Call(
                            ctx,
                            v8::Undefined(isolate),
                            1,
                            param_args).ToLocal(&result)
                            )
                    {
                        std::cout << "cb ok" << std::endl;
                    }
                    else
                    {
                        std::cout << "cb nok" << std::endl;
                    }*/

                    if(callback.As<v8::Function>()->Call(
                            ctx,
                            v8::Undefined(isolate),
                            0,
                            NULL).ToLocal(&result)
                            )
                    {
                        std::cout << "cb okxxx" << std::endl;
                    }
                    else
                    {
                        std::cout << "cb nok" << std::endl;
                    }
                }));


        /*v8::Local<v8::ObjectTemplate> consolex = v8::ObjectTemplate::New(isolate);
        consolex->SetInternalFieldCount(1);
        consolex->Set(v8::String::NewFromUtf8(isolate, "log", v8::NewStringType::kNormal)
                             .ToLocalChecked(),
                     v8::FunctionTemplate::New(isolate, [](const v8::FunctionCallbackInfo <v8::Value> &args) {
                         v8::Isolate  * isolate = args.GetIsolate();
                         v8::String::Utf8Value str(isolate, args[0]);
                         std::cout << "log" << std::endl;
                         printf("%s\n", *str);
                     }));


        global_template->Set(
                v8::String::NewFromUtf8(isolate, "consolex", v8::NewStringType::kNormal)
                        .ToLocalChecked(),
                consolex);*/


        v8::Local<v8::Context> context = v8::Context::New(isolate, NULL, global_template);
        v8::Context::Scope context_scope(context);

        std::string code = "";

        code.append(loadFile("../samples/base.js"));
        code.append(loadFile("../samples/script_a.js"));
        code.append(loadFile("../samples/script_b.js"));
        code.append(loadFile("../samples/script_c.js"));

        code.append(loadFile("../samples/rule.js"));

        std::cout << code << std::endl;

        v8::Local<v8::String> source = v8::String::NewFromUtf8(isolate, code.c_str(),v8::NewStringType::kNormal).ToLocalChecked();
        v8::Local<v8::Script> script = v8::Script::Compile(context, source).ToLocalChecked();
        v8::Local<v8::Value> result = script->Run(context).ToLocalChecked();

        boost::asio::steady_timer t(ioc, boost::asio::chrono::seconds(1));
        t.wait();

        v8::String::Utf8Value utf8(isolate, result);
        printf("output: %s\n", *utf8);

        //v8::Handle<v8::Object> global_output = context->Global();
        v8::Handle<v8::Object> global_output = isolate->GetCurrentContext()->Global();

        //https://stackoverflow.com/questions/22877875/getting-a-localized-global-scope-for-a-v8-function


//        {
//            v8::Local<v8::Array> props = global_output->GetPropertyNames(context).ToLocalChecked();
//
//            for (int j = 0; j <  props->Length(); ++j) {
//                v8::Local<v8::Value> d = props->Get(context, v8::Integer::New(isolate, j)).ToLocalChecked();//props->Get();
//                v8::String::Utf8Value str(isolate, d->ToString(context).ToLocalChecked());
//                std::cout << ">" << *str << std::endl;
//            }
//        }

        v8::Handle<v8::Value> runFunc = global_output->Get(context, v8::String::NewFromUtf8(isolate,"run").ToLocalChecked()).ToLocalChecked();
        if (runFunc->IsFunction()) {

            v8::Handle<v8::Value> rule = global_output->Get(context, v8::String::NewFromUtf8(isolate,"rule").ToLocalChecked()).ToLocalChecked();

            //v8::Local<v8::Value> foo_arg = v8::String::NewFromUtf8(isolate, "arg from C++").ToLocalChecked();
            v8::Local<v8::Value> rule_arg = rule.As<v8::Value>();

            {
                v8::TryCatch trycatch(isolate);
                v8::MaybeLocal<v8::Value> foo_ret = runFunc.As<v8::Object>()->CallAsFunction(context, context->Global(), 1, &rule_arg);

                v8::MaybeLocal<v8::Value> foo_ret2 = runFunc.As<v8::Object>()->CallAsFunction(context, context->Global(), 1, &rule_arg);
//              v8::MaybeLocal<v8::Value> foo_ret = runFunc.As<v8::Object>()->CallAsFunction(context, context->Global(), 0, NULL);

                if (!foo_ret.IsEmpty()) {
                    v8::String::Utf8Value utf8Value(isolate, foo_ret.ToLocalChecked());
                    std::cout << "CallAsFunction result: " << *utf8Value << std::endl;
                } else {
                    v8::String::Utf8Value utf8Value(isolate, trycatch.Message()->Get());
                    std::cout << "CallAsFunction didn't return a value, exception: " << *utf8Value << std::endl;
                }

                if (!foo_ret2.IsEmpty()) {
                    v8::String::Utf8Value utf8Value(isolate, foo_ret2.ToLocalChecked());
                    std::cout << "CallAsFunction result: " << *utf8Value << std::endl;
                } else {
                    v8::String::Utf8Value utf8Value(isolate, trycatch.Message()->Get());
                    std::cout << "CallAsFunction didn't return a value, exception: " << *utf8Value << std::endl;
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

        ioc.run();
    }

    isolate->Dispose();
    v8::V8::Dispose();
    v8::V8::DisposePlatform();
    delete create_params.array_buffer_allocator;

    std::cout << "Hello World!" << std::endl;
}