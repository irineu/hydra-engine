//
// Created by Irineu Antunes on 04/04/23.
//

#include <iostream>
#include <fstream>
#include "dao/MongoDAO.h"
#include "bindings/Console.h"
#include <boost/beast/core.hpp>

#include "v8.h"
#include "libplatform/libplatform.h"
#include "v8-inspector.h"
#include "v8-debug.h"
#include "v8-function-callback.h"
//#include "src/debug/interface-types.h"
//#include "src/debug/debug-interface.h"

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

//    boost::asio::io_context ioc;
//
//    std::make_shared<hydra::bindings::HTTPClient>(ioc)->run("localhost", "3000", "/", 11, [](){
//        std::cout << "on success" << std::endl;
//    }, [](boost::beast::error_code, char const*){
//        std::cout << "on fail" << std::endl;
//    });
//
//    ioc.run();

    initializeV8();


    v8::Isolate::CreateParams create_params;
    create_params.array_buffer_allocator =
            v8::ArrayBuffer::Allocator::NewDefaultAllocator();
    v8::Isolate* isolate = v8::Isolate::New(create_params);
    {
        Console * console = new Console(isolate);
        v8::debug::SetConsoleDelegate(isolate, console);

        v8::Isolate::Scope isolate_scope(isolate);
        // Create a stack-allocated handle scope.
        v8::HandleScope handle_scope(isolate);
        // Create a new context.

        v8::Local<v8::ObjectTemplate> global_template = v8::ObjectTemplate::New(isolate);
        global_template->Set(
                v8::String::NewFromUtf8(isolate, "httpClient", v8::NewStringType::kNormal)
                        .ToLocalChecked(),
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

                    if(callback.As<v8::Function>()->Call(
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
                    }
                }));

        global_template->Set(
                v8::String::NewFromUtf8(isolate, "setTimeout", v8::NewStringType::kNormal)
                        .ToLocalChecked(),
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

                    if(callback.As<v8::Function>()->Call(
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
                    }
                }));

        v8::Local<v8::ObjectTemplate> consolex = v8::ObjectTemplate::New(isolate);
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
                consolex);


        v8::Local<v8::Context> context = v8::Context::New(isolate, NULL, global_template);
        // Enter the context for compiling and running the hello world script.
        v8::Context::Scope context_scope(context);
        // Create a string containing the JavaScript source code.

        std::string code = "";

        code.append(loadFile("../samples/base.js"));
        code.append(loadFile("../samples/script_a.js"));
        code.append(loadFile("../samples/script_b.js"));
        code.append(loadFile("../samples/script_c.js"));
        code.append(loadFile("../samples/rule.js"));

        std::cout << code << std::endl;

//        std::string code =
//                "function getName(){ \
//                return 'irineu' \
//            }\
//\
//                httpClient((arg) => {\
//                    httpClient((arg) => {\
//                        arg\
//                    });\
//                });\
//              (async () => { \
//                \
//                let result = await getName();\
//                \
//            })()\
//            //var x = 'result: ' + JSON.stringify({}) \
//            \
//            ";

        v8::Local<v8::String> source =
                v8::String::NewFromUtf8(isolate, code.c_str(),
                                        v8::NewStringType::kNormal)
                        .ToLocalChecked();
        // Compile the source code.
        v8::Local<v8::Script> script =
                v8::Script::Compile(context, source).ToLocalChecked();
        // Run the script to get the result.
        v8::Local<v8::Value> result = script->Run(context).ToLocalChecked();
        // Convert the result to an UTF8 string and print it.
        v8::String::Utf8Value utf8(isolate, result);
        printf("output: %s\n", *utf8);

        v8::Handle<v8::Object> global_output = context->Global();


        //call from c to js
        v8::Handle<v8::Value> value = global_output->Get(context, v8::String::NewFromUtf8(isolate,
                                                                                   "getName").ToLocalChecked()).ToLocalChecked();

        if (value->IsFunction()) {
            v8::Local<v8::Value> foo_arg = v8::String::NewFromUtf8(isolate, "arg from C++").ToLocalChecked();

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

//            {
//                // Method 2
//                v8::TryCatch trycatch(isolate);
//                v8::Local<v8::Object> foo_object = value.As<v8::Object>();
//                v8::MaybeLocal<v8::Value> foo_result = v8::Function::Cast(*foo_object)->Call(context, context->Global(), 1, &foo_arg);
//                if (!foo_result.IsEmpty()) {
//                    std::cout << "Call result: " << *(v8::String::Utf8Value(isolate, foo_result.ToLocalChecked())) << std::endl;
//                } else {
//                    v8::String::Utf8Value utf8Value(isolate, trycatch.Message()->Get());
//                    std::cout << "CallAsFunction didn't return a value, exception: " << *utf8Value << std::endl;
//                }
//            }
        }
    }
    // Dispose the isolate and tear down V8.
    isolate->Dispose();
    v8::V8::Dispose();
    v8::V8::DisposePlatform();
    delete create_params.array_buffer_allocator;

    std::cout << "Hello World!" << std::endl;
}