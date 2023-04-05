wget https://github.com/mongodb/mongo-c-driver/releases/download/1.23.2/mongo-c-driver-1.23.2.tar.gz
tar xzf mongo-c-driver-1.23.2.tar.gz
mkdir mongo-c-driver-1.23.2/cmake-build
cd mongo-c-driver-1.23.2/cmake-build
mkdir release
cmake -DENABLE_AUTOMATIC_INIT_AND_CLEANUP=OFF -DCMAKE_INSTALL_PREFIX=./release -DCMAKE_PREFIX_PATH=./release ..
cmake --build .
cmake --build . --target install
cd ../../
rm mongo-c-driver-1.23.2.tar.gz

curl -OL https://github.com/mongodb/mongo-cxx-driver/releases/download/r3.7.1/mongo-cxx-driver-r3.7.1.tar.gz
tar -xzf mongo-cxx-driver-r3.7.1.tar.gz
cd mongo-cxx-driver-r3.7.1/build
cmake .. -DCMAKE_BUILD_TYPE=Release -D CMAKE_PREFIX_PATH=/Users/irineuantunes/CLionProjects/hydra-engine/dependencies/mongo-c-driver-1.23.2/cmake-build/release
cmake --build .
cmake --build . --target install
cd ../../
rm mongo-cxx-driver-r3.7.1.tar.gz