cmake_minimum_required(VERSION 3.24)
project(hydra_engine)

set(CMAKE_CXX_STANDARD 23)

add_compile_definitions(
        V8_COMPRESS_POINTERS
        V8_ENABLE_SANDBOX
)

include_directories(/opt/homebrew/Cellar/v8/11.1.277.17/include)

add_executable(hydra_engine src/Main.cpp src/dao/MongoDAO.cpp src/bindings/HTTPClient.cpp src/bindings/HTTPClient.h)

target_include_directories(hydra_engine PRIVATE ./src)

#boost
target_include_directories(hydra_engine PRIVATE dependencies/boost)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/boost/stage/lib/libboost_system.dylib)

#v8
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

#hiredis
target_include_directories(hydra_engine PRIVATE dependencies/hiredis/build/release/include)
target_link_libraries(hydra_engine ${CMAKE_CURRENT_LIST_DIR}/dependencies/hiredis/build/release/lib/libhiredis.dylib)