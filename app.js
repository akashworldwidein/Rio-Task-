import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Platform,
  Switch,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import DateTimePicker from "@react-native-community/datetimepicker";

/* ================= NOTIFICATION CONFIG ================= */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/* ================= MAIN APP ================= */
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [text, setText] = useState("");
  const [category, setCategory] = useState("Tasks");
  const [important, setImportant] = useState(false);

  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [repeat, setRepeat] = useState("none");

  const [dark, setDark] = useState(true);
  const [modal, setModal] = useState(false);

  /* ========== LOAD DATA ========== */
  useEffect(() => {
    registerNotifications();
    loadData();
  }, []);

  async function loadData() {
    const saved = await AsyncStorage.getItem("TASKS");
    const theme = await AsyncStorage.getItem("THEME");
    if (saved) setTasks(JSON.parse(saved));
    if (theme) setDark(theme === "dark");
  }

  async function saveTasks(data) {
    setTasks(data);
    await AsyncStorage.setItem("TASKS", JSON.stringify(data));
  }

  async function toggleTheme() {
    const mode = !dark;
    setDark(mode);
    await AsyncStorage.setItem("THEME", mode ? "dark" : "light");
  }

  /* ========== NOTIFICATIONS ========== */
  async function registerNotifications() {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
  }

  async function schedule(task) {
    let trigger;

    if (repeat === "daily") {
      trigger = { hour: date.getHours(), minute: date.getMinutes(), repeats: true };
    } else if (repeat === "weekly") {
      trigger = {
        weekday: date.getDay() + 1,
        hour: date.getHours(),
        minute: date.getMinutes(),
        repeats: true,
      };
    } else {
      trigger = date;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ Task Reminder",
        body: task.text,
      },
      trigger,
    });
  }

  /* ========== TASK ACTIONS ========== */
  async function addTask() {
    if (!text.trim()) return;

    const task = {
      id: Date.now().toString(),
      text,
      category,
      important,
      date,
      repeat,
    };

    const newTasks = [...tasks, task];
    await saveTasks(newTasks);
    await schedule(task);

    setText("");
    setImportant(false);
    setRepeat("none");
    setModal(false);
  }

  function filteredTasks() {
    return tasks.filter(t => t.category === category);
  }

  /* ================= UI ================= */
  return (
    <View style={[styles.container, dark && styles.darkBg]}>
      <View style={styles.header}>
        <Text style={[styles.title, dark && styles.darkText]}>Rio Task</Text>
        <Switch value={dark} onValueChange={toggleTheme} />
      </View>

      {/* CATEGORY TABS */}
      <View style={styles.tabs}>
        {["My Day", "Important", "Planned", "Tasks"].map(t => (
          <TouchableOpacity key={t} onPress={() => setCategory(t)}>
            <Text
              style={[
                styles.tab,
                category === t && styles.activeTab,
                dark && styles.darkText,
              ]}
            >
              {t}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* TASK LIST */}
      <FlatList
        data={filteredTasks()}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <View style={[styles.task, dark && styles.darkCard]}>
            <Text style={[styles.taskText, dark && styles.darkText]}>
              {item.important ? "⭐ " : ""}
              {item.text}
            </Text>
          </View>
        )}
      />

      {/* ADD BUTTON */}
      <TouchableOpacity style={styles.addBtn} onPress={() => setModal(true)}>
        <Text style={styles.addText}>＋</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={modal} animationType="slide">
        <View style={[styles.modal, dark && styles.darkBg]}>
          <Text style={[styles.modalTitle, dark && styles.darkText]}>
            New Task
          </Text>

          <TextInput
            placeholder="Task name"
            placeholderTextColor={dark ? "#9ca3af" : "#6b7280"}
            style={[styles.input, dark && styles.darkInput]}
            value={text}
            onChangeText={setText}
          />

          <View style={styles.row}>
            <Text style={[styles.label, dark && styles.darkText]}>Important</Text>
            <Switch value={important} onValueChange={setImportant} />
          </View>

          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <Text style={[styles.pick, dark && styles.darkText]}>
              Pick Date & Time
            </Text>
          </TouchableOpacity>

          {showPicker && (
            <DateTimePicker
              value={date}
              mode="datetime"
              display="default"
              onChange={(e, d) => {
                setShowPicker(false);
                if (d) setDate(d);
              }}
            />
          )}

          <View style={styles.row}>
            <Text style={[styles.label, dark && styles.darkText]}>Repeat</Text>
            {["none", "daily", "weekly"].map(r => (
              <TouchableOpacity key={r} onPress={() => setRepeat(r)}>
                <Text
                  style={[
                    styles.repeat,
                    repeat === r && styles.activeRepeat,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={addTask}>
            <Text style={styles.saveText}>Save Task</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, padding: 16, backgroundColor: "#f2f2f7" },
  darkBg: { backgroundColor: "#000" },
  header: { flexDirection: "row", justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "700" },
  darkText: { color: "#fff" },

  tabs: { flexDirection: "row", gap: 12, marginVertical: 12 },
  tab: { fontSize: 14, opacity: 0.7 },
  activeTab: { fontWeight: "700", opacity: 1 },

  task: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  darkCard: { backgroundColor: "#1c1c1e" },
  taskText: { fontSize: 16 },

  addBtn: {
    position: "absolute",
    right: 20,
    bottom: 30,
    backgroundColor: "#0a84ff",
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { color: "#fff", fontSize: 30 },

  modal: { flex: 1, padding: 20 },
  modalTitle: { fontSize: 22, marginBottom: 10 },

  input: {
    backgroundColor: "#e5e5ea",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  darkInput: { backgroundColor: "#2c2c2e", color: "#fff" },

  row: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 8 },
  label: { fontSize: 16 },

  pick: { marginVertical: 8, color: "#0a84ff" },

  repeat: { marginRight: 10, opacity: 0.6 },
  activeRepeat: { fontWeight: "700", opacity: 1 },

  saveBtn: {
    backgroundColor: "#0a84ff",
    padding: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  saveText: { color: "#fff", textAlign: "center", fontSize: 16 },
});
