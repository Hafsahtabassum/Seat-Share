import { Ionicons } from "@expo/vector-icons";
import ExpoStatusBar from "expo-status-bar/build/ExpoStatusBar";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import React, { useEffect } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../api/firebase";
import ChatBubble from "../components/ChatBubble";
import { CarState } from "../context/CarContext";
import { lightModColor } from "../style/Color";
import LoadingScreen from "./LoadingScreen";

const OneToOneChat = ({ route, navigation }) => {
  const dates = new Set();
  const [text, setText] = React.useState("");
  const { user, userDoc } = CarState();
  const { number, name, id } = route.params;
  const [messages, setMessages] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [data, setData] = React.useState();

  const _scrollView = React.useRef(null);

  const chatId = user > number ? user + number : number + user;
  useEffect(() => {
    setIsLoading(true);
    const collectionRef = collection(db, "messages", id, "privateChats");
    const q = query(collectionRef, orderBy("sentAt", "asc"));

    const formatDate = (date) => {
      const td = new Date();
      const dateNow = td.getDate();
      const monthNow = td.getMonth() + 1;
      const yearNow = td.getFullYear();
      const d = new Date(date);
      const h = d.getDate();
      const m = d.getMonth() + 1;
      const s = d.getFullYear();
      if (dateNow == h + 1 && monthNow == m && yearNow == s) {
        return "Yesterday";
      } else if (dateNow == h && monthNow == m && yearNow == s) {
        return "Today";
      } else {
        return `${h}/${m}/${s}`;
      }
    };

    const unsub = onSnapshot(q, (snapshot) => {
      console.log("snapshot!");
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          createdAt: doc.data().createdAt,
          message: doc.data().text,
          name: doc.data().name,
          sentTo: doc.data().sentTo,
          sentToName: doc.data().sentToName,
          time: doc.data().time,
          user: doc.data().sentBy,
          sentAt: formatDate(doc.data().sentAt.toDate()),
        }))
      );
      // const docRef = doc(db, "Users-Data", messages.user);
      // getDoc(docRef).then((snapshot) => {
      //   if (snapshot.exists) {
      //     setData({
      //       name: snapshot.data().name,
      //       phone: messages.user,
      //     });
      //   } else {
      //     console.log("No doc found");
      //   }
      // });
      setIsLoading(false);
    });

    // console.log(messages);
    return unsub;
  }, []);
  const renderDate = (chat, dateNum) => {
    dates.add(dateNum);

    return (
      <View
        style={{
          backgroundColor: "#d4d7db",
          alignSelf: "center",
          padding: 5,
          borderRadius: 5,
          marginTop: 5,
        }}
      >
        <Text>{chat.sentAt}</Text>
      </View>
    );
  };

  const onSend = () => {
    var date = new Date();
    var time = date.toLocaleTimeString();
    var H = +time.substr(0, 2);
    var h = H % 12 || 12;
    var ampm = H < 12 || H === 24 ? " AM" : " PM";
    time = h + time.substr(2, 3) + ampm;
    const collectionRef = collection(db, "messages", chatId, "privateChats");
    const collectionRef2 = doc(db, "Users-Data", user, "messages", chatId);
    const collectionRef3 = doc(db, "Users-Data", number, "messages", chatId);
    setDoc(collectionRef3, {
      lastMsg: text,
      lastMsgTime: time,
      lastMsgBy: user,
      recieverName: name,
      senderName: userDoc.name,
      latest: serverTimestamp(),
    });
    setDoc(collectionRef2, {
      lastMsg: text,
      lastMsgTime: time,
      lastMsgBy: user,
      recieverName: name,
      senderName: userDoc.name,
      latest: serverTimestamp(),
    });
    addDoc(collectionRef, {
      text: text,
      sentBy: user,
      name: userDoc.name,
      sentTime: time,
      sentAt: new Date(),

      time: time,
    }).catch((error) => {
      Alert.alert("Error", error.message);
    });
    setText("");
  };

  return (
    <>
      {isLoading && <LoadingScreen />}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
      >
        <View
          style={{
            height: "100%",
          }}
        >
          <View style={{ flex: 1, width: "100%" }}>
            <View>
              {messages && (
                <SectionList
                  style={{ marginBottom: 80 }}
                  sections={[
                    {
                      data: messages,
                      renderItem: ({ item }) => (
                        <React.Fragment key={item.id}>
                          {dates.has(item.sentAt)
                            ? null
                            : renderDate(item, item.sentAt)}
                          <ChatBubble
                            key={item.id}
                            message={item.message}
                            sentTime={item.time}
                            backgroundColor={
                              item.user == user
                                ? lightModColor.themeBackground
                                : "white"
                            }
                            flex={item.user == user ? "flex-end" : "flex-start"}
                            nameColor={"orange"}
                            fontColor={item.user == user ? "white" : "black"}
                            name={
                              item.user === user
                                ? null
                                : item.name
                                ? item.name
                                : item.user
                            }
                          />
                        </React.Fragment>
                      ),
                    },
                  ]}
                />
              )}
            </View>
            <View
              style={{
                position: "absolute",
                bottom: 20,
                width: "100%",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginVertical: 5,
                marginHorizontal: 10,
              }}
            >
              <TextInput
                style={{
                  height: 40,
                  borderRadius: 20,
                  paddingHorizontal: 10,
                  width: "70%",
                  backgroundColor: "white",
                }}
                placeholder="Enter your message"
                onChangeText={(text) => setText(text)}
                value={text}
              />
              <TouchableOpacity
                disabled={text.length == 0}
                style={{
                  opacity: text.length == 0 ? 0.5 : 1,
                  height: 40,
                  backgroundColor: lightModColor.themeBackground,
                  borderRadius: 20,
                  marginRight: 20,
                  alignItems: "center",
                  justifyContent: "center",
                  width: "20%",
                }}
                onPress={onSend}
              >
                <Text style={{ color: "white" }}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
      <ExpoStatusBar style="light" animated={true} />
    </>
  );
};

export default OneToOneChat;
