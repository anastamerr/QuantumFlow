cmake_minimum_required(VERSION 3.18)
project(quantumflow_native LANGUAGES CXX)

find_package(Python3 REQUIRED COMPONENTS Interpreter Development.Module)

Python3_add_library(quantumflow_native MODULE circuit_analyzer.cpp)
target_compile_features(quantumflow_native PRIVATE cxx_std_17)

if(MSVC)
  target_compile_options(quantumflow_native PRIVATE /O2 /W4 /EHsc)
else()
  target_compile_options(quantumflow_native PRIVATE -O3 -Wall -Wextra -Wpedantic)
endif()

set(NATIVE_OUTPUT_DIR "${CMAKE_CURRENT_SOURCE_DIR}/../app/_native")
set_target_properties(
  quantumflow_native
  PROPERTIES
    PREFIX ""
    LIBRARY_OUTPUT_DIRECTORY "${NATIVE_OUTPUT_DIR}"
    RUNTIME_OUTPUT_DIRECTORY "${NATIVE_OUTPUT_DIR}"
)

foreach(CONFIG Debug Release RelWithDebInfo MinSizeRel)
  string(TOUPPER "${CONFIG}" CONFIG_UPPER)
  set_target_properties(
    quantumflow_native
    PROPERTIES
      LIBRARY_OUTPUT_DIRECTORY_${CONFIG_UPPER} "${NATIVE_OUTPUT_DIR}"
      RUNTIME_OUTPUT_DIRECTORY_${CONFIG_UPPER} "${NATIVE_OUTPUT_DIR}"
  )
endforeach()
