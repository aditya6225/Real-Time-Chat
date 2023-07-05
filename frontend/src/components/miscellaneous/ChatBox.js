import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import classNames from "classnames";
import GroupAddModal from "./GroupAddModal.js";
import io from "socket.io-client";
const ENDPOINT = "http://localhost:3001";

var socket, selectedChatCompare;

const ChatBox = ({
  chatMessages,
  id,
  user,
  chatId,
  isGroupChat,
  isChatOpen,
  setIsChatOpen,
  chatName,
  userList,
  authtoken,
  chatList,

}) => {
  const [groupModify, setGroupModify] = useState(false);
  const [messages, setMessages] = useState(chatMessages);
  const [socketConnected, setsocketConnected] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [notification, setNotification] = useState();

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setsocketConnected(true));
    socket.emit("join chat", chatId);
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, [chatId]);
  const modifyHandler = () => {
    setGroupModify(!groupModify);
  };
  const closehandler = () => {
    setGroupModify(false);
  };
  useEffect(() => {
    selectedChatCompare = chatId;
  }, [chatId]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (newMessage) {
      socket.emit("stop typing", chatId);
      const config = {};
      const data2 = JSON.stringify({
        content: newMessage,
        chatId: chatId,
      });
      const response = await fetch("http://localhost:3001/api/message", {
        method: "POST",
        body: data2,
        headers: {
          "Content-type": "application/json",
          authorization: `Bearer ${authtoken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        socket.emit("new message", data.message);
        setMessages([data.message,...messages]);
        setNewMessage("");
      } else {
        toast.error("error sending message")
      }
    }
  };

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          console.log(notification);
        }
      } else {
        setMessages([newMessageRecieved,...messages]);
      }
    });
  });

  const typingHandler = (e) => {
    setNewMessage(e.target.value);
    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", id,userList);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", chatId);
        setTyping(false);
      }
    }, timerLength);
  };
  const handleback = () => {
    setIsChatOpen(false);
  }
  return (
    <div>
      <div><button onClick={handleback} className="cursor-pointer bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-1 px-6 border hover:border-transparent rounded mb-2 ml-2 mt-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 15.75L3 12m0 0l3.75-3.75M3 12h18" />
      </svg>
      </button></div>
      {!isGroupChat && (
        <div className="mx-3 h-screen">

          {userList[0]._id === id ? (
            <div className="bg-green-600 text-white rounded-xl m-1 flex justify-start p-3 text-lg ">
              {" "}
              <img
                className="rounded-3xl mx-2"
                width="40rem"
                src={userList[1].profilePic}
                alt=""
              />{" "}
              {userList[1].name}
            </div>
          ) : (
            <div className="bg-green-600 text-white rounded-xl flex justify-start p-3 text-lg ">
              {" "}
              <img src={userList[0].profilePic} alt="" /> {userList[0].name}
            </div>
          )}
          <div
            className="flex flex-col-reverse w-full overflow-auto "
            style={{ boxSizing: "border-box", height: "71.5vh" }}
          >
            {messages?.map((message) => (
              <div
                key={message._id}
                className={classNames("p-2 rounded-lg mb-2", {
                  "bg-gray-200 self-end": message.sender._id === id,
                  "bg-blue-200 self-start": message.sender._id !== id,
                })}
              >
                <span className="font-bold font-['inter']">
                  {message.sender._id === id ? "You" : message.sender.name}:
                </span>{" "}
                {message.content}
                <span className="text-xs text-gray-500 ml-1">
                  {message.createdAt.slice(11, 19)}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full h-1/6">
            <div className="bg-gray-200 p-4 w-full">
              {/* Message Box */}
              {istyping ? <div>typing...</div> : <></>}
              <form className="flex">
                <input
                  type="text"
                  placeholder="Type your message..."
                  className="flex-1 bg-white border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none"
                  value={newMessage}
                  onChange={typingHandler}
                />
                <button
                  type="submit"
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-r-lg px-4 py-2 ml-2"
                  onClick={sendMessage}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>

                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {isGroupChat && (
        <div className="">
          <div className="sm:mx-3">
            <div className="bg-green-600 text-white rounded-xl m-1 flex justify-between p-3 text-lg">
              {chatName}
              <div
                className="h-1/12 flex"
                style={{ alignItems: "center", justifyContent: "end" }}
              >
                <button onClick={modifyHandler}>
                  <i className="fa-solid fa-eye fa-xl p-5"></i>
                </button>
              </div>
            </div>
            <div>
              <GroupAddModal
                chatName={chatName}
                userList={userList}
                authtoken={authtoken}
                isOpen={groupModify}
                onClose={closehandler}
                chatId={chatId}
                chatList={chatList}
                user={user}
              />
            </div>
            <div
              className="flex flex-col-reverse w-full overflow-auto "
              style={{ boxSizing: "border-box", height: "71.5vh" }}
            >
              {messages?.map((message) => (
                <div
                  key={message._id}
                  className={classNames("p-2 rounded-lg mb-2", {
                    "bg-gray-200 self-end": message.sender._id === id,
                    "bg-blue-200 self-start": message.sender._id !== id,
                  })}
                >
                  <span className="font-bold font-['inter']">
                    {message.sender._id === id ? "You" : message.sender.name}:
                  </span>{" "}
                  {message.content}
                  <span className="text-xs text-gray-500 ml-1">
                    {/* {message.timestamp} */}
                  </span>
                </div>
              ))}
            </div>
            <div className="w-full h-1/6 m-1 ">
              <div className="bg-gray-200 p-2 sm:p-4 w-full rounded-xl">
                {/* Message Box */}
                <form className="flex">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    className="flex-1 bg-white border border-gray-300 rounded-l-lg px-4 py-2 focus:outline-none rounded-sm"
                    value={newMessage}
                    onChange={typingHandler}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-sm sm:text-base rounded-r-lg sm:px-4 sm:py-2 ml-1 sm:ml-2"
                    onClick={sendMessage}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15l3-3m0 0l-3-3m3 3h-7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>

                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatBox;
