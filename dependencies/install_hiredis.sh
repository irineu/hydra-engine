git clone https://github.com/redis/hiredis.git
mkdir hiredis/build
cd hiredis/build
mkdir release
cmake .. -DCMAKE_INSTALL_PREFIX=./release
make
cmake --install .
