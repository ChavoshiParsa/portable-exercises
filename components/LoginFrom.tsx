import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  FlatList,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Cache } from "react-native-cache";
import Student from "@/models/student";

type PageState = "form" | "show";

const studentCache = new Cache({
  namespace: "students",
  policy: {
    maxEntries: 5000,
    stdTTL: 0,
  },
  backend: AsyncStorage,
});

export default function LoginScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [page, setPage] = useState<PageState>("form");

  const addStudent = async (firstName: string, lastName: string) => {
    const newStudent = new Student(firstName, lastName);
    const updatedStudents = [newStudent, ...students];
    setStudents(updatedStudents);

    try {
      await studentCache.set("studentsList", JSON.stringify(updatedStudents));
    } catch (error) {
      console.error("Error caching students:", error);
    }
  };

  useEffect(() => {
    const loadCachedStudents = async () => {
      try {
        const cachedStudents = await studentCache.get("studentsList");
        if (cachedStudents) {
          const studentDataArray = JSON.parse(cachedStudents) as {
            firstName: string;
            lastName: string;
          }[];
          const studentInstances = studentDataArray.map(
            (studentData) =>
              new Student(studentData.firstName, studentData.lastName)
          );
          setStudents(studentInstances);
        }
      } catch (error) {
        console.error("Error loading cached students:", error);
      }
    };
    loadCachedStudents();
  }, []);

  return (
    <View style={styles.container}>
      {page === "form" ? (
        <StudentForm onAddStudent={addStudent} onShow={() => setPage("show")} />
      ) : (
        <StudentList students={students} onAddNew={() => setPage("form")} />
      )}
    </View>
  );
}

type StudentFormProps = {
  onAddStudent: (firstName: string, lastName: string) => void;
  onShow: () => void;
};

const StudentForm: React.FC<StudentFormProps> = ({ onAddStudent, onShow }) => {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleAddStudent = () => {
    if (!firstName || !lastName) {
      setError("Please fill out all fields.");
      return;
    }
    setError("");
    onAddStudent(firstName, lastName);
    setFirstName("");
    setLastName("");
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.header}>Login Form</Text>
      <TextInput
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        style={styles.input}
      />
      <TextInput
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        style={styles.input}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
      <Button title="Add Student" onPress={handleAddStudent} />
      <Button title="Show Students" color="#24a" onPress={onShow} />
    </View>
  );
};

type StudentListProps = {
  students: Student[];
  onAddNew: () => void;
};

const StudentList: React.FC<StudentListProps> = ({ students, onAddNew }) => {
  return (
    <View style={styles.listContainer}>
      <Text style={styles.header}>Student Information</Text>
      <FlatList
        data={students}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={styles.studentBox}>
            <Text style={styles.studentText}>
              {index + 1}: {item.getFullName()}
            </Text>
          </View>
        )}
      />
      <Button title="Add Another Student" onPress={onAddNew} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  formContainer: {
    width: "100%",
    gap: 12,
  },
  listContainer: {
    width: "100%",
    gap: 12,
    paddingVertical: 60,
  },
  header: {
    textAlign: "center",
    fontSize: 26,
    fontWeight: "bold",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 5,
  },
  studentBox: {
    backgroundColor: "#4CAF50",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 4,
  },
  studentText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  errorText: {
    color: "red",
  },
});
