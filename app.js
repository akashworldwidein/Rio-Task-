import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
} from "react-native";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

/* ================= NOTIFICATION CONFIG ================= */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForNotifications() {
  const { status } = await Notifications.getPermissionsAsync();
  let finalStatus = status;

  if (status !== "granted") {
    const permission = await Notifications.requestPermissionsAsync();
    finalStatus = permission.status;
  }

  if (finalStatus !== "granted") {
    alert("Notification permission denied!");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

/* ================= MAIN APP ================= */
export default function App() {
  const [task, setTask] = useState("");
  const [tasks, setTasks] = useState([]);

  /* Load tasks */
  useEffect(() => {
    registerForNotifications();
    loadTasks();
  }, []);

  async function loadTasks() {
    const saved = await AsyncStorage.getItem("tasks");
    if (saved) setTasks(JSON.parse(saved));
  }

  async function saveTasks(newTasks) {
    setTasks(newTasks);
    await AsyncStorage.setItem("tasks", JSON.stringify(newTasks));
  }

  /* Schedule reminder */
  async function scheduleReminder(taskName) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Task Reminder",
        body: `Time to finish: ${taskName}`,
        sound: true,
      },
      trigger: { seconds: 5 }, // change time if needed
    });
  }

  /* Add task */
  async function addTask() {
    if (!task.trim()) return;
    const newTasks = [...tasks, { id: Date.now().toString(), text: task }];
    await saveTasks(newTasks);
    scheduleReminder(task);
    setTask("");
  }

  /* Delete task */
  async function deleteTask(id) {
    const newTasks = tasks.filter((t) => t.id !== id);
    await saveTasks(newTasks);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rio Task</Text>

      <View style={styles.inputRow}>
        <TextInput
          placeholder="New task"
          placeholderTextColor="#9ca3af"
          value={task}
          onChangeText={setTask}
          style={styles.input}
        />
        <TouchableOpacity style={styles.addBtn} onPress={addTask}>
          <Text style={styles.addText}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskItem}>
            <Text style={styles.taskText}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={styles.delete}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <Text style={styles.footer}>Developed by akashworldwide</Text>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: "#2c2c2e",
    color: "#fff",
    padding: 14,
    borderRadius: 16,
    fontSize: 16,
  },
  addBtn: {
    marginLeft: 10,
    backgroundColor: "#0a84ff",
    width: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    color: "#fff",
    fontSize: 28,
  },
  taskItem: {
    backgroundColor: "#2c2c2e",
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  taskText: {
    color: "#fff",
    fontSize: 16,
  },
  delete: {
    color: "#ff453a",
    fontSize: 20,
  },
  footer: {
    textAlign: "center",
    color: "#9ca3af",
    marginTop: 20,
    fontSize: 12,
  },
});
