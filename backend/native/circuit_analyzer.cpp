#define PY_SSIZE_T_CLEAN
#include <Python.h>

#include <algorithm>
#include <cstdint>
#include <string>
#include <unordered_map>
#include <unordered_set>

namespace {

PyObject* borrowed_dict_item(PyObject* mapping, const char* key) {
    return PyDict_GetItemString(mapping, key);
}

bool is_python_int(PyObject* value) {
    return value != nullptr && PyLong_Check(value);
}

long python_int(PyObject* value) {
    return PyLong_AsLong(value);
}

void add_sequence_qubits(PyObject* value, std::unordered_set<long>& qubits) {
    if (value == nullptr || value == Py_None) {
        return;
    }

    PyObject* sequence = PySequence_Fast(value, "gate targets/controls must be iterable");
    if (sequence == nullptr) {
        PyErr_Clear();
        return;
    }

    const Py_ssize_t size = PySequence_Fast_GET_SIZE(sequence);
    PyObject** items = PySequence_Fast_ITEMS(sequence);
    for (Py_ssize_t index = 0; index < size; ++index) {
        if (is_python_int(items[index])) {
            const long qubit = python_int(items[index]);
            if (!PyErr_Occurred()) {
                qubits.insert(qubit);
            } else {
                PyErr_Clear();
            }
        }
    }
    Py_DECREF(sequence);
}

bool set_dict_item(PyObject* mapping, const char* key, PyObject* value) {
    if (value == nullptr) {
        return false;
    }
    const int status = PyDict_SetItemString(mapping, key, value);
    Py_DECREF(value);
    return status == 0;
}

PyObject* power_of_two(long exponent) {
    if (exponent <= 0) {
        return PyLong_FromLong(0);
    }
    PyObject* one = PyLong_FromLong(1);
    PyObject* shift = PyLong_FromLong(exponent);
    if (one == nullptr || shift == nullptr) {
        Py_XDECREF(one);
        Py_XDECREF(shift);
        return nullptr;
    }
    PyObject* result = PyNumber_Lshift(one, shift);
    Py_DECREF(one);
    Py_DECREF(shift);
    return result;
}

PyObject* analyze_hardware_metrics(PyObject*, PyObject* args) {
    int num_qubits = 0;
    PyObject* gates_object = nullptr;
    if (!PyArg_ParseTuple(args, "iO:analyze_hardware_metrics", &num_qubits, &gates_object)) {
        return nullptr;
    }

    PyObject* gates = PySequence_Fast(gates_object, "gates must be a sequence of dictionaries");
    if (gates == nullptr) {
        return nullptr;
    }

    std::unordered_map<std::string, std::int64_t> gate_counts;
    std::unordered_set<long> t_positions;
    std::unordered_set<long> entangling_positions;
    std::int64_t cnot_count = 0;
    std::int64_t measurement_count = 0;
    std::int64_t single_qubit = 0;
    std::int64_t two_qubit = 0;
    std::int64_t multi_qubit = 0;
    std::int64_t entangling_gate_count = 0;
    long max_position = -1;

    const Py_ssize_t gate_count = PySequence_Fast_GET_SIZE(gates);
    PyObject** gate_items = PySequence_Fast_ITEMS(gates);
    for (Py_ssize_t index = 0; index < gate_count; ++index) {
        PyObject* gate = gate_items[index];
        if (!PyDict_Check(gate)) {
            Py_DECREF(gates);
            PyErr_SetString(PyExc_TypeError, "each gate must be a dictionary");
            return nullptr;
        }

        std::string gate_type = "unknown";
        PyObject* type_value = borrowed_dict_item(gate, "type");
        if (type_value != nullptr && type_value != Py_None) {
            PyObject* type_text = PyObject_Str(type_value);
            if (type_text == nullptr) {
                Py_DECREF(gates);
                return nullptr;
            }
            const char* utf8 = PyUnicode_AsUTF8(type_text);
            if (utf8 == nullptr) {
                Py_DECREF(type_text);
                Py_DECREF(gates);
                return nullptr;
            }
            gate_type.assign(utf8);
            Py_DECREF(type_text);
        }
        ++gate_counts[gate_type];

        PyObject* position_value = borrowed_dict_item(gate, "position");
        const bool has_position = is_python_int(position_value);
        long position = -1;
        if (has_position) {
            position = python_int(position_value);
            if (PyErr_Occurred()) {
                PyErr_Clear();
                position = -1;
            } else {
                max_position = std::max(max_position, position);
            }
        }

        if (gate_type == "cnot" || gate_type == "cx") {
            ++cnot_count;
        }
        if (gate_type == "measure") {
            ++measurement_count;
        }
        if (gate_type == "t" && has_position) {
            t_positions.insert(position);
        }

        if (gate_type != "measure") {
            std::unordered_set<long> qubits;
            PyObject* qubit_value = borrowed_dict_item(gate, "qubit");
            if (is_python_int(qubit_value)) {
                const long qubit = python_int(qubit_value);
                if (!PyErr_Occurred()) {
                    qubits.insert(qubit);
                } else {
                    PyErr_Clear();
                }
            }
            add_sequence_qubits(borrowed_dict_item(gate, "targets"), qubits);
            add_sequence_qubits(borrowed_dict_item(gate, "controls"), qubits);

            if (qubits.size() <= 1) {
                ++single_qubit;
            } else if (qubits.size() == 2) {
                ++two_qubit;
                ++entangling_gate_count;
                if (has_position) {
                    entangling_positions.insert(position);
                }
            } else {
                ++multi_qubit;
                ++entangling_gate_count;
                if (has_position) {
                    entangling_positions.insert(position);
                }
            }
        }
    }
    Py_DECREF(gates);

    const long circuit_depth = max_position >= 0 ? max_position + 1 : 0;
    const std::int64_t non_measure_count =
        std::max<std::int64_t>(single_qubit + two_qubit + multi_qubit, 1);
    const double entanglement_ratio =
        static_cast<double>(entangling_gate_count) / static_cast<double>(non_measure_count);
    const long qv_qubits =
        num_qubits > 0 && circuit_depth > 0 ? std::min<long>(num_qubits, circuit_depth) : 0;

    PyObject* result = PyDict_New();
    PyObject* counts = PyDict_New();
    if (result == nullptr || counts == nullptr) {
        Py_XDECREF(result);
        Py_XDECREF(counts);
        return nullptr;
    }

    for (const auto& entry : gate_counts) {
        PyObject* value = PyLong_FromLongLong(entry.second);
        if (value == nullptr || PyDict_SetItemString(counts, entry.first.c_str(), value) != 0) {
            Py_XDECREF(value);
            Py_DECREF(counts);
            Py_DECREF(result);
            return nullptr;
        }
        Py_DECREF(value);
    }

    bool ok = true;
    ok = ok && set_dict_item(result, "circuit_depth", PyLong_FromLong(circuit_depth));
    ok = ok && set_dict_item(result, "circuit_width", PyLong_FromLong(num_qubits));
    ok = ok && PyDict_SetItemString(result, "gate_count", counts) == 0;
    Py_DECREF(counts);
    ok = ok && set_dict_item(result, "t_count", PyLong_FromLongLong(gate_counts["t"]));
    ok = ok && set_dict_item(result, "t_depth", PyLong_FromSize_t(t_positions.size()));
    ok = ok && set_dict_item(result, "cnot_count", PyLong_FromLongLong(cnot_count));
    ok = ok && set_dict_item(result, "single_qubit_gates", PyLong_FromLongLong(single_qubit));
    ok = ok && set_dict_item(result, "two_qubit_gates", PyLong_FromLongLong(two_qubit));
    ok = ok && set_dict_item(result, "multi_qubit_gates", PyLong_FromLongLong(multi_qubit));
    ok = ok && set_dict_item(result, "measurement_count", PyLong_FromLongLong(measurement_count));
    ok = ok && set_dict_item(result, "entanglement_ratio", PyFloat_FromDouble(entanglement_ratio));
    ok = ok && set_dict_item(
        result, "entanglement_depth", PyLong_FromSize_t(entangling_positions.size()));
    ok = ok && set_dict_item(result, "quantum_volume", power_of_two(qv_qubits));
    Py_INCREF(Py_None);
    ok = ok && set_dict_item(result, "estimated_fidelity", Py_None);
    ok = ok && set_dict_item(result, "analyzer_engine", PyUnicode_FromString("cpp"));

    if (!ok) {
        Py_DECREF(result);
        return nullptr;
    }
    return result;
}

PyMethodDef module_methods[] = {
    {"analyze_hardware_metrics", analyze_hardware_metrics, METH_VARARGS,
     "Analyze quantum-circuit hardware metrics in one native C++ pass."},
    {nullptr, nullptr, 0, nullptr},
};

PyModuleDef module_definition = {
    PyModuleDef_HEAD_INIT,
    "quantumflow_native",
    "Native C++ accelerators for QuantumFlow.",
    -1,
    module_methods,
};

}  // namespace

PyMODINIT_FUNC PyInit_quantumflow_native() {
    return PyModule_Create(&module_definition);
}
