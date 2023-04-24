cmake_minimum_required(VERSION 3.24)
project(hydra_engine)

set(CMAKE_CXX_STANDARD 23)

find_package(quill REQUIRED)

add_compile_definitions(
        V8_COMPRESS_POINTERS
        V8_ENABLE_SANDBOX
)


include_directories(/Users/irineuantunes/Downloads/v8-refs_tags_11.1.277.17)
include_directories(/opt/homebrew/Cellar/v8/11.1.277.17/include)
include_directories(/opt/homebrew/Cellar/quill/2.8.0/include)

add_executable(hydra_engine src/Main.cpp src/dao/MongoDAO.cpp src/bindings/HTTPClient.cpp src/bindings/HTTPClient.h src/bindings/Console.cpp src/bindings/Console.h src/bindings/Async.cpp src/bindings/Async.h src/HydraEngine.cpp src/HydraEngine.h)

target_include_directories(hydra_engine PRIVATE /opt/homebrew/Cellar/quill/2.8.0/include)
target_link_libraries(hydra_engine /opt/homebrew/Cellar/quill/2.8.0/lib/libquill.a)

#boost
target_include_directories(hydra_engine PRIVATE dependencies/boost)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/boost/stage/lib/libboost_system.dylib)

#v8
target_include_directories(hydra_engine PRIVATE /Users/irineuantunes/Downloads/v8-refs_tags_11.1.277.17)
target_include_directories(hydra_engine PRIVATE /opt/homebrew/Cellar/v8/11.1.277.17/include)
target_link_libraries(hydra_engine /opt/homebrew/Cellar/v8/11.1.277.17/lib/libv8.dylib)
target_link_libraries(hydra_engine /opt/homebrew/Cellar/v8/11.1.277.17/lib/libv8_libplatform.dylib)

#MongoDB
target_include_directories(hydra_engine PRIVATE dependencies/mongo-cxx-driver-r3.7.1/build/install/include/bsoncxx/v_noabi)
target_include_directories(hydra_engine PRIVATE dependencies/mongo-cxx-driver-r3.7.1/build/install/include/mongocxx/v_noabi)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/mongo-c-driver-1.23.2/cmake-build/release/lib/libbson-1.0.dylib)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/mongo-c-driver-1.23.2/cmake-build/release/lib/libmongoc-1.0.dylib)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/mongo-cxx-driver-r3.7.1/build/install/lib/libbsoncxx.dylib)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/mongo-cxx-driver-r3.7.1/build/install/lib/libmongocxx.dylib)

#hiredis - TODO remove
target_include_directories(hydra_engine PRIVATE dependencies/hiredis/build/release/include)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/hiredis/build/release/lib/libhiredis.dylib)